package com.izikwen.mbtaoptimizer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.izikwen.mbtaoptimizer.client.MbtaApiClient;
import com.izikwen.mbtaoptimizer.config.GeoBounds;
import com.izikwen.mbtaoptimizer.dto.response.ZoneInfoResponse;
import com.izikwen.mbtaoptimizer.dto.response.ZoneScoreResponse;
import com.izikwen.mbtaoptimizer.entity.ZoneData;
import com.izikwen.mbtaoptimizer.repository.DataSetRepository;
import com.izikwen.mbtaoptimizer.repository.ZoneDataRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes zones as a pure function of stop locations from the transit API.
 * Deterministic: same stops → same zones every time.
 *
 * Zone score = demand_score - service_score (the "gap").
 *   High score = high demand, poor service → needs optimization.
 *
 * Demand comes from the active dataset (if one is selected) or falls back
 * to a deterministic synthesis based on city-center distance.
 *
 * Service is computed from nearby stops weighted by inverse distance * frequency.
 */
@Service
public class ZoneService {

    private static final double CELL_SIZE = 0.02; // ~2km grid

    // --- demand synthesis fallback params ---
    private static final double POP_SIGMA_KM = 6.0;
    private static final double JOB_SIGMA_KM = 3.0;
    private static final double W_POP = 0.40;
    private static final double W_JOB = 0.40;
    private static final double W_CAR = 0.20;

    // --- service score params ---
    private static final double SERVICE_RADIUS_KM = 3.0;
    private static final double FREQ_HEAVY_RAIL   = 12;
    private static final double FREQ_LIGHT_RAIL   = 10;
    private static final double FREQ_BUS          = 4;
    private static final double FREQ_COMMUTER     = 2;

    private final MbtaApiClient mbtaClient;
    private final DataSetRepository dataSetRepo;
    private final ZoneDataRepository zoneDataRepo;

    public ZoneService(MbtaApiClient mbtaClient,
                       DataSetRepository dataSetRepo,
                       ZoneDataRepository zoneDataRepo) {
        this.mbtaClient = mbtaClient;
        this.dataSetRepo = dataSetRepo;
        this.zoneDataRepo = zoneDataRepo;
    }

    // ---- public API ---------------------------------------------------

    public List<ZoneInfoResponse> getZones() {
        return computeZones(fetchTypedStops());
    }

    public List<ZoneScoreResponse> getZoneScores() {
        List<TypedStop> stops = fetchTypedStops();
        List<ZoneInfoResponse> zones = computeZones(stops);
        double[] center = centroid(stops);

        // Try to load active dataset factors
        Map<String, ZoneData> activeData = loadActiveDataset(
                zones.stream().map(ZoneInfoResponse::getZoneId).toList());

        List<ZoneScoreResponse> scores = new ArrayList<>();
        for (ZoneInfoResponse z : zones) {
            double demand;
            ZoneData zd = activeData.get(z.getZoneId());
            if (zd != null) {
                // Use dataset factors
                demand = W_POP * zd.getPopulationDensity()
                       + W_JOB * zd.getJobDensity()
                       - W_CAR * zd.getCarOwnership();
                demand = clamp01(demand + 0.2);
            } else {
                // Fallback: synthesized from distance
                demand = demandScoreSynthesized(z.getCenterLat(), z.getCenterLng(), center);
            }

            double service = serviceScore(z.getCenterLat(), z.getCenterLng(), stops);

            double gap = demand - service;
            double score = Math.max(0, Math.min(100, 50 + gap * 50));
            score = Math.round(score * 10.0) / 10.0;

            scores.add(new ZoneScoreResponse(z.getZoneId(), z.getName(), score));
        }
        return scores;
    }

    // ---- active dataset lookup ----------------------------------------

    private Map<String, ZoneData> loadActiveDataset(List<String> zoneIds) {
        return dataSetRepo.findByActiveTrue()
                .map(ds -> zoneDataRepo.findByDataSet_IdAndZoneIdIn(ds.getId(), zoneIds)
                        .stream()
                        .collect(Collectors.toMap(ZoneData::getZoneId, zd -> zd)))
                .orElse(Map.of());
    }

    // ---- demand synthesis fallback -------------------------------------

    private double demandScoreSynthesized(double lat, double lng, double[] cityCenter) {
        double distKm = haversineKm(lat, lng, cityCenter[0], cityCenter[1]);
        double popDensity  = gaussian(distKm, POP_SIGMA_KM) * spatialNoise(lat, lng, 1);
        double jobDensity  = gaussian(distKm, JOB_SIGMA_KM) * spatialNoise(lat, lng, 2);
        double carOwnership = 1.0 - 0.7 * gaussian(distKm, POP_SIGMA_KM);
        double raw = W_POP * popDensity + W_JOB * jobDensity - W_CAR * carOwnership;
        return clamp01(raw + 0.2);
    }

    // ---- service score ------------------------------------------------

    private double serviceScore(double lat, double lng, List<TypedStop> stops) {
        double raw = 0;
        for (TypedStop s : stops) {
            double distKm = haversineKm(lat, lng, s.lat, s.lng);
            if (distKm > SERVICE_RADIUS_KM || distKm < 0.01) continue;
            raw += freqForType(s.routeType) / distKm;
        }
        return clamp01(raw / 300.0);
    }

    private double freqForType(int routeType) {
        return switch (routeType) {
            case 1 -> FREQ_HEAVY_RAIL;
            case 0 -> FREQ_LIGHT_RAIL;
            case 3 -> FREQ_BUS;
            case 2 -> FREQ_COMMUTER;
            default -> FREQ_BUS;
        };
    }

    // ---- zone grid computation ----------------------------------------

    private List<ZoneInfoResponse> computeZones(List<TypedStop> stops) {
        if (stops.isEmpty()) return List.of();

        double minLat = Double.MAX_VALUE, maxLat = -Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE, maxLng = -Double.MAX_VALUE;
        for (TypedStop s : stops) {
            minLat = Math.min(minLat, s.lat);
            maxLat = Math.max(maxLat, s.lat);
            minLng = Math.min(minLng, s.lng);
            maxLng = Math.max(maxLng, s.lng);
        }

        double originLat = Math.floor(minLat / CELL_SIZE) * CELL_SIZE;
        double originLng = Math.floor(minLng / CELL_SIZE) * CELL_SIZE;
        int rows = (int) Math.ceil((maxLat - originLat) / CELL_SIZE) + 1;
        int cols = (int) Math.ceil((maxLng - originLng) / CELL_SIZE) + 1;

        int[][] counts = new int[rows][cols];
        for (TypedStop s : stops) {
            int r = Math.min((int) ((s.lat - originLat) / CELL_SIZE), rows - 1);
            int c = Math.min((int) ((s.lng - originLng) / CELL_SIZE), cols - 1);
            counts[r][c]++;
        }

        List<ZoneInfoResponse> zones = new ArrayList<>();
        int zoneNum = 1;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (counts[r][c] < 1) continue;
                double cMinLat = round6(originLat + r * CELL_SIZE);
                double cMaxLat = round6(cMinLat + CELL_SIZE);
                double cMinLng = round6(originLng + c * CELL_SIZE);
                double cMaxLng = round6(cMinLng + CELL_SIZE);
                String id = String.format("Z-%03d", zoneNum++);
                zones.add(new ZoneInfoResponse(id, id,
                        round6((cMinLat + cMaxLat) / 2), round6((cMinLng + cMaxLng) / 2),
                        cMinLat, cMinLng, cMaxLat, cMaxLng));
            }
        }
        return zones;
    }

    // ---- MBTA API fetch -----------------------------------------------

    List<TypedStop> fetchTypedStops() {
        List<TypedStop> stops = new ArrayList<>();
        for (String typeFilter : List.of("0,1", "3")) {
            int routeType = typeFilter.equals("3") ? 3 : 1;
            try {
                JsonNode json = mbtaClient.getAllStops(typeFilter);
                for (JsonNode stop : json.path("data")) {
                    double lat = stop.path("attributes").path("latitude").asDouble(0);
                    double lng = stop.path("attributes").path("longitude").asDouble(0);
                    int vt = stop.path("attributes").path("vehicle_type").asInt(routeType);
                    if (lat != 0 && lng != 0 && GeoBounds.inBounds(lat, lng)) {
                        stops.add(new TypedStop(lat, lng, vt));
                    }
                }
            } catch (Exception e) {
                // skip
            }
        }
        return stops;
    }

    // ---- helpers -------------------------------------------------------

    private double gaussian(double dist, double sigma) {
        return Math.exp(-(dist * dist) / (2 * sigma * sigma));
    }

    private double spatialNoise(double lat, double lng, int seed) {
        long bits = Double.doubleToLongBits(round6(lat)) * 31
                  + Double.doubleToLongBits(round6(lng)) * 17
                  + seed * 1_000_003L;
        bits ^= (bits >>> 21);
        bits ^= (bits << 35);
        bits ^= (bits >>> 4);
        double noise = ((bits & 0xFFFFL) / (double) 0xFFFFL);
        return 0.7 + noise * 0.6;
    }

    private double[] centroid(List<TypedStop> stops) {
        double sumLat = 0, sumLng = 0;
        for (TypedStop s : stops) { sumLat += s.lat; sumLng += s.lng; }
        return new double[]{ sumLat / stops.size(), sumLng / stops.size() };
    }

    private double clamp01(double v) { return Math.max(0, Math.min(1, v)); }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round6(double v) {
        return Math.round(v * 1_000_000.0) / 1_000_000.0;
    }

    record TypedStop(double lat, double lng, int routeType) {}
}

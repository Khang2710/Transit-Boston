package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.response.DataSetResponse;
import com.izikwen.mbtaoptimizer.dto.response.DataSetResponse.ZoneDataDto;
import com.izikwen.mbtaoptimizer.dto.response.ZoneInfoResponse;
import com.izikwen.mbtaoptimizer.entity.DataSet;
import com.izikwen.mbtaoptimizer.entity.ZoneData;
import com.izikwen.mbtaoptimizer.exception.ResourceNotFoundException;
import com.izikwen.mbtaoptimizer.repository.DataSetRepository;
import com.izikwen.mbtaoptimizer.repository.ZoneDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class DataSetService {

    private final DataSetRepository dataSetRepo;
    private final ZoneDataRepository zoneDataRepo;
    private final ZoneService zoneService;

    public DataSetService(DataSetRepository dataSetRepo,
                          ZoneDataRepository zoneDataRepo,
                          ZoneService zoneService) {
        this.dataSetRepo = dataSetRepo;
        this.zoneDataRepo = zoneDataRepo;
        this.zoneService = zoneService;
    }

    /**
     * Generate a new random dataset with demand factors for every zone.
     * Uses the zone grid from the live MBTA stop data, then randomizes
     * population density, job density, and car ownership per zone
     * with realistic city-like distributions (higher density near center).
     */
    @Transactional
    public DataSetResponse generate(Long seed) {
        List<ZoneInfoResponse> zones = zoneService.getZones();
        if (zones.isEmpty()) {
            throw new IllegalStateException("No zones computed — cannot generate dataset");
        }

        // Compute city center from zone centroids
        double centerLat = zones.stream().mapToDouble(ZoneInfoResponse::getCenterLat).average().orElse(0);
        double centerLng = zones.stream().mapToDouble(ZoneInfoResponse::getCenterLng).average().orElse(0);

        Random rng = (seed != null) ? new Random(seed) : new Random();

        // Create dataset record
        DataSet ds = new DataSet();
        String ts = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")
                .withZone(ZoneOffset.UTC).format(Instant.now());
        ds.setName("dataset-" + ts);
        ds.setActive(false);
        ds.setCreatedAt(Instant.now());
        ds = dataSetRepo.save(ds);

        // Generate per-zone data
        List<ZoneData> rows = new ArrayList<>();
        List<ZoneDataDto> dtos = new ArrayList<>();

        for (ZoneInfoResponse z : zones) {
            double distKm = haversineKm(z.getCenterLat(), z.getCenterLng(), centerLat, centerLng);

            // Population density: peaks near center, decays with distance, randomized
            double popBase = Math.exp(-(distKm * distKm) / (2 * 36)); // sigma=6km
            double popDensity = clamp01(popBase * (0.6 + rng.nextDouble() * 0.8));

            // Job density: sharper peak downtown
            double jobBase = Math.exp(-(distKm * distKm) / (2 * 9)); // sigma=3km
            double jobDensity = clamp01(jobBase * (0.5 + rng.nextDouble() * 1.0));

            // Car ownership: high in suburbs, low downtown
            double carBase = 1.0 - 0.7 * Math.exp(-(distKm * distKm) / (2 * 36));
            double carOwnership = clamp01(carBase * (0.7 + rng.nextDouble() * 0.6));

            popDensity  = round2(popDensity);
            jobDensity  = round2(jobDensity);
            carOwnership = round2(carOwnership);

            ZoneData zd = new ZoneData();
            zd.setDataSet(ds);
            zd.setZoneId(z.getZoneId());
            zd.setPopulationDensity(popDensity);
            zd.setJobDensity(jobDensity);
            zd.setCarOwnership(carOwnership);
            rows.add(zd);

            dtos.add(new ZoneDataDto(z.getZoneId(), popDensity, jobDensity, carOwnership));
        }

        zoneDataRepo.saveAll(rows);

        DataSetResponse resp = new DataSetResponse(ds.getId(), ds.getName(), ds.getActive(), ds.getCreatedAt());
        resp.setZones(dtos);
        return resp;
    }

    /**
     * List all datasets (without zone-level detail).
     */
    public List<DataSetResponse> listAll() {
        return dataSetRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(ds -> new DataSetResponse(ds.getId(), ds.getName(), ds.getActive(), ds.getCreatedAt()))
                .toList();
    }

    /**
     * Get a single dataset with all its zone data.
     */
    public DataSetResponse getById(Long id) {
        DataSet ds = dataSetRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found: " + id));
        List<ZoneData> rows = zoneDataRepo.findByDataSet_Id(id);
        DataSetResponse resp = new DataSetResponse(ds.getId(), ds.getName(), ds.getActive(), ds.getCreatedAt());
        resp.setZones(rows.stream()
                .map(r -> new ZoneDataDto(r.getZoneId(), r.getPopulationDensity(),
                        r.getJobDensity(), r.getCarOwnership()))
                .toList());
        return resp;
    }

    /**
     * Activate a dataset — deactivates all others.
     */
    @Transactional
    public DataSetResponse activate(Long id) {
        DataSet target = dataSetRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found: " + id));

        // Deactivate current active
        dataSetRepo.findByActiveTrue().ifPresent(prev -> {
            prev.setActive(false);
            dataSetRepo.save(prev);
        });

        target.setActive(true);
        dataSetRepo.save(target);

        return getById(id);
    }

    /**
     * Delete a dataset and its zone data.
     */
    @Transactional
    public void delete(Long id) {
        DataSet ds = dataSetRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dataset not found: " + id));
        List<ZoneData> rows = zoneDataRepo.findByDataSet_Id(id);
        zoneDataRepo.deleteAll(rows);
        dataSetRepo.delete(ds);
    }

    /**
     * Returns the active dataset's zone data as a map, or null if none active.
     */
    public List<ZoneData> getActiveZoneData() {
        return dataSetRepo.findByActiveTrue()
                .map(ds -> zoneDataRepo.findByDataSet_Id(ds.getId()))
                .orElse(null);
    }

    private double clamp01(double v) { return Math.max(0, Math.min(1, v)); }
    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

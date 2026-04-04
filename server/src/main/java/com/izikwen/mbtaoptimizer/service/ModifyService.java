package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.request.ModifyLineRequest;
import com.izikwen.mbtaoptimizer.dto.request.ModifyStopRequest;
import com.izikwen.mbtaoptimizer.dto.response.ModifyLineResponse;
import com.izikwen.mbtaoptimizer.dto.response.ZoneScoreResponse;
import com.izikwen.mbtaoptimizer.entity.RouteSegment;
import com.izikwen.mbtaoptimizer.entity.TransitRoute;
import com.izikwen.mbtaoptimizer.entity.TransitStop;
import com.izikwen.mbtaoptimizer.exception.ResourceNotFoundException;
import com.izikwen.mbtaoptimizer.repository.RouteSegmentRepository;
import com.izikwen.mbtaoptimizer.repository.TransitRouteRepository;
import com.izikwen.mbtaoptimizer.repository.TransitStopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModifyService {

    private final TransitStopRepository stopRepository;
    private final TransitRouteRepository routeRepository;
    private final RouteSegmentRepository segmentRepository;
    private final ZoneService zoneService;

    public ModifyService(TransitStopRepository stopRepository,
                         TransitRouteRepository routeRepository,
                         RouteSegmentRepository segmentRepository,
                         ZoneService zoneService) {
        this.stopRepository = stopRepository;
        this.routeRepository = routeRepository;
        this.segmentRepository = segmentRepository;
        this.zoneService = zoneService;
    }

    @Transactional
    public List<ZoneScoreResponse> modifyStop(ModifyStopRequest request) {
        TransitStop stop = stopRepository.findById(request.getStopId())
                .orElseThrow(() -> new ResourceNotFoundException("Stop not found: " + request.getStopId()));

        String type = request.getModificationType().toUpperCase();
        switch (type) {
            case "MOVE" -> {
                if (request.getModification() == null
                        || request.getModification().getNewLat() == null
                        || request.getModification().getNewLng() == null) {
                    throw new IllegalArgumentException("MOVE requires modification with newLat and newLng");
                }
                stop.setLat(request.getModification().getNewLat());
                stop.setLng(request.getModification().getNewLng());
                stopRepository.save(stop);
            }
            case "DELETE" -> {
                stop.setActive(false);
                stopRepository.save(stop);
            }
            default -> throw new IllegalArgumentException("Unknown modificationType: " + type + ". Use MOVE or DELETE.");
        }

        return zoneService.getZoneScores();
    }

    @Transactional
    public ModifyLineResponse modifyLine(ModifyLineRequest request) {
        TransitRoute route = routeRepository.findById(request.getLine())
                .orElseThrow(() -> new ResourceNotFoundException("Line/route not found: " + request.getLine()));

        String type = request.getModificationType().toUpperCase();
        switch (type) {
            case "INCR_SERVICE" -> {
                List<RouteSegment> segments = segmentRepository.findByRoute_Id(route.getId());
                for (RouteSegment seg : segments) {
                    int reduced = Math.max(30, seg.getAverageWaitTimeSeconds() - 60);
                    seg.setAverageWaitTimeSeconds(reduced);
                }
                segmentRepository.saveAll(segments);
            }
            case "DECR_SERVICE" -> {
                List<RouteSegment> segments = segmentRepository.findByRoute_Id(route.getId());
                for (RouteSegment seg : segments) {
                    seg.setAverageWaitTimeSeconds(seg.getAverageWaitTimeSeconds() + 60);
                }
                segmentRepository.saveAll(segments);
            }
            case "ADD_STOP" -> {
                if (request.getModification() == null || request.getModification().getStopId() == null) {
                    throw new IllegalArgumentException("ADD_STOP requires modification with stopId");
                }
                TransitStop stopToAdd = stopRepository.findById(request.getModification().getStopId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Stop not found: " + request.getModification().getStopId()));

                List<RouteSegment> existing = segmentRepository.findByRoute_Id(route.getId());
                TransitStop lastStop = existing.isEmpty() ? null
                        : existing.get(existing.size() - 1).getToStop();

                if (lastStop != null) {
                    RouteSegment newSeg = new RouteSegment();
                    newSeg.setRoute(route);
                    newSeg.setFromStop(lastStop);
                    newSeg.setToStop(stopToAdd);
                    newSeg.setDistanceMeters(haversine(lastStop, stopToAdd));
                    newSeg.setAverageTravelTimeSeconds(180);
                    newSeg.setAverageWaitTimeSeconds(300);
                    newSeg.setOperatingCostPerHour(java.math.BigDecimal.valueOf(150));
                    newSeg.setCapacity(80);
                    segmentRepository.save(newSeg);
                }
            }
            case "REMOVE_STOP" -> {
                if (request.getModification() == null || request.getModification().getStopId() == null) {
                    throw new IllegalArgumentException("REMOVE_STOP requires modification with stopId");
                }
                Long stopId = request.getModification().getStopId();
                List<RouteSegment> segments = segmentRepository.findByRoute_Id(route.getId());
                List<RouteSegment> toRemove = segments.stream()
                        .filter(s -> s.getFromStop().getId().equals(stopId)
                                || s.getToStop().getId().equals(stopId))
                        .toList();
                segmentRepository.deleteAll(toRemove);
            }
            default -> throw new IllegalArgumentException(
                    "Unknown modificationType: " + type + ". Use INCR_SERVICE, DECR_SERVICE, ADD_STOP, or REMOVE_STOP.");
        }

        List<ZoneScoreResponse> scores = zoneService.getZoneScores();
        return new ModifyLineResponse(scores, request.getTime());
    }

    private double haversine(TransitStop from, TransitStop to) {
        double dLat = Math.toRadians(to.getLat() - from.getLat());
        double dLng = Math.toRadians(to.getLng() - from.getLng());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(from.getLat())) * Math.cos(Math.toRadians(to.getLat()))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

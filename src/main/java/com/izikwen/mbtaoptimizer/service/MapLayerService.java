package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.response.*;
import com.izikwen.mbtaoptimizer.entity.HeatmapCell;
import com.izikwen.mbtaoptimizer.entity.RouteSegment;
import com.izikwen.mbtaoptimizer.entity.TransitStop;
import com.izikwen.mbtaoptimizer.repository.HeatmapCellRepository;
import com.izikwen.mbtaoptimizer.repository.RouteSegmentRepository;
import com.izikwen.mbtaoptimizer.repository.TransitStopRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class MapLayerService {
    private final TransitStopRepository stopRepository;
    private final RouteSegmentRepository segmentRepository;
    private final HeatmapCellRepository heatmapCellRepository;

    public MapLayerService(TransitStopRepository stopRepository,
                           RouteSegmentRepository segmentRepository,
                           HeatmapCellRepository heatmapCellRepository) {
        this.stopRepository = stopRepository;
        this.segmentRepository = segmentRepository;
        this.heatmapCellRepository = heatmapCellRepository;
    }

    public NetworkLayerResponse getNetworkLayer() {
        List<StopResponse> stops = stopRepository.findAll().stream().map(this::toStopResponse).toList();
        List<RouteSegmentResponse> segments = segmentRepository.findAll().stream().map(this::toSegmentResponse).toList();

        NetworkLayerResponse response = new NetworkLayerResponse();
        response.setMode("NETWORK");
        response.setStops(stops);
        response.setSegments(segments);
        return response;
    }

    public HeatmapLayerResponse getHeatmapLayer(String areaCode, Integer hour, String metricType) {
        List<HeatmapPointResponse> points = heatmapCellRepository
                .findByAreaCodeIgnoreCaseAndHourOfDayAndMetricTypeIgnoreCase(areaCode, hour, metricType)
                .stream()
                .map(this::toHeatmapPoint)
                .toList();

        HeatmapLayerResponse response = new HeatmapLayerResponse();
        response.setAreaCode(areaCode);
        response.setHourOfDay(hour);
        response.setMetricType(metricType);
        response.setPoints(points);
        return response;
    }

    private StopResponse toStopResponse(TransitStop stop) {
        StopResponse response = new StopResponse();
        response.setId(stop.getId());
        response.setMbtaStopId(stop.getMbtaStopId());
        response.setName(stop.getName());
        response.setMode(stop.getMode());
        response.setLat(stop.getLat());
        response.setLng(stop.getLng());
        response.setActive(stop.getActive());
        response.setMovable(stop.getMovable());
        return response;
    }

    private RouteSegmentResponse toSegmentResponse(RouteSegment segment) {
        RouteSegmentResponse response = new RouteSegmentResponse();
        response.setId(segment.getId());
        response.setRouteName(segment.getRoute().getLongName() != null ? segment.getRoute().getLongName() : segment.getRoute().getShortName());
        response.setRouteColor(segment.getRoute().getColor());
        response.setFromStopId(segment.getFromStop().getId());
        response.setToStopId(segment.getToStop().getId());
        response.setDistanceMeters(segment.getDistanceMeters());
        response.setAverageTravelTimeSeconds(segment.getAverageTravelTimeSeconds());
        response.setAverageWaitTimeSeconds(segment.getAverageWaitTimeSeconds());
        return response;
    }

    private HeatmapPointResponse toHeatmapPoint(HeatmapCell cell) {
        HeatmapPointResponse response = new HeatmapPointResponse();
        response.setLat(cell.getLat());
        response.setLng(cell.getLng());
        response.setIntensity(cell.getIntensity());
        return response;
    }

    public List<HeatmapGridCellResponse> getDynamicGridHeatmap(
            double minLat, double minLng, double maxLat, double maxLng) {

        double cellSize = 0.005;

        double latDiff = maxLat - minLat;
        double lngDiff = maxLng - minLng;

        if ((latDiff / cellSize) * (lngDiff / cellSize) > 2000) {
            cellSize = Math.max(latDiff / 40.0, lngDiff / 40.0);
        }

        int rows = (int) Math.ceil(latDiff / cellSize);
        int cols = (int) Math.ceil(lngDiff / cellSize);

        List<HeatmapGridCellResponse> cells = new ArrayList<>(rows * cols);

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                double cellMinLat = minLat + r * cellSize;
                double cellMinLng = minLng + c * cellSize;
                double cellMaxLat = cellMinLat + cellSize;
                double cellMaxLng = cellMinLng + cellSize;
                double intensity = Math.random();
                cells.add(new HeatmapGridCellResponse(cellMinLat, cellMinLng, cellMaxLat, cellMaxLng, intensity));
            }
        }

        return cells;
    }
}

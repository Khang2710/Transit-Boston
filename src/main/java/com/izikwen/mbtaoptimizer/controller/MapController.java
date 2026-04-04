package com.izikwen.mbtaoptimizer.controller;

import com.izikwen.mbtaoptimizer.dto.response.HeatmapGridCellResponse;
import com.izikwen.mbtaoptimizer.dto.response.HeatmapLayerResponse;
import com.izikwen.mbtaoptimizer.dto.response.NetworkLayerResponse;
import com.izikwen.mbtaoptimizer.service.MapLayerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/map")
public class MapController {
    private final MapLayerService mapLayerService;

    public MapController(MapLayerService mapLayerService) {
        this.mapLayerService = mapLayerService;
    }

    @GetMapping("/network")
    public NetworkLayerResponse network() {
        return mapLayerService.getNetworkLayer();
    }

    @GetMapping("/heatmap")
    public HeatmapLayerResponse heatmap(@RequestParam String areaCode,
                                        @RequestParam Integer hour,
                                        @RequestParam(defaultValue = "DEMAND") String metricType) {
        return mapLayerService.getHeatmapLayer(areaCode, hour, metricType);
    }

    @GetMapping("/heatmap-grid")
    public ResponseEntity<List<HeatmapGridCellResponse>> heatmapGrid(
            @RequestParam double minLat,
            @RequestParam double minLng,
            @RequestParam double maxLat,
            @RequestParam double maxLng) {
        List<HeatmapGridCellResponse> cells =
                mapLayerService.getDynamicGridHeatmap(minLat, minLng, maxLat, maxLng);
        return ResponseEntity.ok(cells);
    }
}

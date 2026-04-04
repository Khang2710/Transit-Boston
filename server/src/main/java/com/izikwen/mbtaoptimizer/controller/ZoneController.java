package com.izikwen.mbtaoptimizer.controller;

import com.izikwen.mbtaoptimizer.dto.response.ZoneInfoResponse;
import com.izikwen.mbtaoptimizer.dto.response.ZoneScoreResponse;
import com.izikwen.mbtaoptimizer.service.ZoneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping
    public ResponseEntity<List<ZoneInfoResponse>> getZones() {
        return ResponseEntity.ok(zoneService.getZones());
    }

    @GetMapping("/scores")
    public ResponseEntity<List<ZoneScoreResponse>> getZoneScores() {
        return ResponseEntity.ok(zoneService.getZoneScores());
    }
}

package com.izikwen.mbtaoptimizer.controller;

import com.izikwen.mbtaoptimizer.dto.request.RouteRequest;
import com.izikwen.mbtaoptimizer.dto.response.RouteResponse;
import com.izikwen.mbtaoptimizer.service.RoutingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/route")
public class RoutingController {

    private final RoutingService routingService;

    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }

    @PostMapping
    public ResponseEntity<RouteResponse> findRoute(@RequestBody RouteRequest request) {
        return ResponseEntity.ok(routingService.findRoute(request));
    }
}

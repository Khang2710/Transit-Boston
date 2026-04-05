package com.izikwen.mbtaoptimizer.controller;

import com.izikwen.mbtaoptimizer.dto.request.FareRequest;
import com.izikwen.mbtaoptimizer.dto.response.FareResponse;
import com.izikwen.mbtaoptimizer.service.FareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fares")
public class FareController {

    private final FareService fareService;

    public FareController(FareService fareService) {
        this.fareService = fareService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<FareResponse> estimateFare(@RequestBody FareRequest request) {
        return ResponseEntity.ok(fareService.estimateFare(request));
    }
}

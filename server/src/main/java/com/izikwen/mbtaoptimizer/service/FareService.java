package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.request.FareRequest;
import com.izikwen.mbtaoptimizer.dto.response.FareResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FareService {

    public FareResponse estimateFare(FareRequest request) {
        List<String> modes = request.getTripModes();
        if (modes == null || modes.isEmpty()) {
            return new FareResponse(0.0, "$0.00 (No modes selected)");
        }

        boolean hasExpress = modes.contains("EXPRESS");
        boolean hasSubway = modes.contains("SUBWAY");
        boolean hasBus = modes.contains("BUS");
        boolean reduced = request.getIsReducedFare();

        double totalFare = 0;
        StringBuilder breakdown = new StringBuilder();

        if (hasExpress) {
            totalFare = reduced ? 2.10 : 4.25;
            breakdown.append(String.format("$%.2f (Express Bus)", totalFare));
            if (hasSubway || hasBus) {
                breakdown.append(" + $0.00 (Transfers included)");
            }
        } else if (hasSubway) {
            totalFare = reduced ? 1.10 : 2.40;
            breakdown.append(String.format("$%.2f (Subway)", totalFare));
            if (hasBus) {
                breakdown.append(" + $0.00 (Bus transfer)");
            }
        } else if (hasBus) {
            totalFare = reduced ? 0.85 : 1.70;
            breakdown.append(String.format("$%.2f (Local Bus)", totalFare));
        }

        return new FareResponse(totalFare, breakdown.toString());
    }
}

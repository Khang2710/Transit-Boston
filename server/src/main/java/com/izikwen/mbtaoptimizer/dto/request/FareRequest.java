package com.izikwen.mbtaoptimizer.dto.request;

import java.util.List;

public class FareRequest {
    private List<String> tripModes;
    private boolean isReducedFare;

    public FareRequest() {}

    public List<String> getTripModes() {
        return tripModes;
    }

    public void setTripModes(List<String> tripModes) {
        this.tripModes = tripModes;
    }

    public boolean getIsReducedFare() {
        return isReducedFare;
    }

    public void setIsReducedFare(boolean reducedFare) {
        isReducedFare = reducedFare;
    }
}

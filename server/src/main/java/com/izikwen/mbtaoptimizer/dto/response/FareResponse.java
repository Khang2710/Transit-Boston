package com.izikwen.mbtaoptimizer.dto.response;

public class FareResponse {
    private double totalFare;
    private String fareBreakdown;

    public FareResponse(double totalFare, String fareBreakdown) {
        this.totalFare = totalFare;
        this.fareBreakdown = fareBreakdown;
    }

    public double getTotalFare() {
        return totalFare;
    }

    public void setTotalFare(double totalFare) {
        this.totalFare = totalFare;
    }

    public String getFareBreakdown() {
        return fareBreakdown;
    }

    public void setFareBreakdown(String fareBreakdown) {
        this.fareBreakdown = fareBreakdown;
    }
}

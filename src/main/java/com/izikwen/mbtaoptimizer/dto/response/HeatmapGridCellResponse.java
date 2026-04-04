package com.izikwen.mbtaoptimizer.dto.response;

public class HeatmapGridCellResponse {

    private double minLat;
    private double minLng;
    private double maxLat;
    private double maxLng;
    private double intensity;

    public HeatmapGridCellResponse(double minLat, double minLng, double maxLat, double maxLng, double intensity) {
        this.minLat = minLat;
        this.minLng = minLng;
        this.maxLat = maxLat;
        this.maxLng = maxLng;
        this.intensity = intensity;
    }

    public double getMinLat() { return minLat; }
    public void setMinLat(double minLat) { this.minLat = minLat; }

    public double getMinLng() { return minLng; }
    public void setMinLng(double minLng) { this.minLng = minLng; }

    public double getMaxLat() { return maxLat; }
    public void setMaxLat(double maxLat) { this.maxLat = maxLat; }

    public double getMaxLng() { return maxLng; }
    public void setMaxLng(double maxLng) { this.maxLng = maxLng; }

    public double getIntensity() { return intensity; }
    public void setIntensity(double intensity) { this.intensity = intensity; }
}

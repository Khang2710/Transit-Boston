package com.izikwen.mbtaoptimizer.dto.response;

import java.util.List;

public class RouteResponse {

    private List<RouteSegment> segments;
    private double totalDistanceMi;
    private int totalStops;
    private int transfers;
    private String summary;

    public RouteResponse() {}
    public RouteResponse(List<RouteSegment> segments, double totalDistanceMi, int totalStops, int transfers, String summary) {
        this.segments = segments;
        this.totalDistanceMi = totalDistanceMi;
        this.totalStops = totalStops;
        this.transfers = transfers;
        this.summary = summary;
    }

    public List<RouteSegment> getSegments() { return segments; }
    public void setSegments(List<RouteSegment> segments) { this.segments = segments; }
    public double getTotalDistanceMi() { return totalDistanceMi; }
    public void setTotalDistanceMi(double totalDistanceMi) { this.totalDistanceMi = totalDistanceMi; }
    public int getTotalStops() { return totalStops; }
    public void setTotalStops(int totalStops) { this.totalStops = totalStops; }
    public int getTransfers() { return transfers; }
    public void setTransfers(int transfers) { this.transfers = transfers; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public static class RouteSegment {
        private String lineId;
        private String lineName;
        private String mode;
        private String color;
        private List<StopPoint> stops;

        public RouteSegment() {}
        public RouteSegment(String lineId, String lineName, String mode, String color, List<StopPoint> stops) {
            this.lineId = lineId;
            this.lineName = lineName;
            this.mode = mode;
            this.color = color;
            this.stops = stops;
        }

        public String getLineId() { return lineId; }
        public void setLineId(String lineId) { this.lineId = lineId; }
        public String getLineName() { return lineName; }
        public void setLineName(String lineName) { this.lineName = lineName; }
        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
        public List<StopPoint> getStops() { return stops; }
        public void setStops(List<StopPoint> stops) { this.stops = stops; }
    }

    public static class StopPoint {
        private String name;
        private double lat;
        private double lng;

        public StopPoint() {}
        public StopPoint(String name, double lat, double lng) {
            this.name = name;
            this.lat = lat;
            this.lng = lng;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public double getLat() { return lat; }
        public void setLat(double lat) { this.lat = lat; }
        public double getLng() { return lng; }
        public void setLng(double lng) { this.lng = lng; }
    }
}

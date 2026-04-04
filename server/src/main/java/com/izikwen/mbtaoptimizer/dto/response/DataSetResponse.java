package com.izikwen.mbtaoptimizer.dto.response;

import java.time.Instant;
import java.util.List;

public class DataSetResponse {
    private Long id;
    private String name;
    private Boolean active;
    private Instant createdAt;
    private List<ZoneDataDto> zones;

    public DataSetResponse() {}

    public DataSetResponse(Long id, String name, Boolean active, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<ZoneDataDto> getZones() { return zones; }
    public void setZones(List<ZoneDataDto> zones) { this.zones = zones; }

    public static class ZoneDataDto {
        private String zoneId;
        private Double populationDensity;
        private Double jobDensity;
        private Double carOwnership;

        public ZoneDataDto() {}
        public ZoneDataDto(String zoneId, Double populationDensity, Double jobDensity, Double carOwnership) {
            this.zoneId = zoneId;
            this.populationDensity = populationDensity;
            this.jobDensity = jobDensity;
            this.carOwnership = carOwnership;
        }

        public String getZoneId() { return zoneId; }
        public void setZoneId(String zoneId) { this.zoneId = zoneId; }
        public Double getPopulationDensity() { return populationDensity; }
        public void setPopulationDensity(Double populationDensity) { this.populationDensity = populationDensity; }
        public Double getJobDensity() { return jobDensity; }
        public void setJobDensity(Double jobDensity) { this.jobDensity = jobDensity; }
        public Double getCarOwnership() { return carOwnership; }
        public void setCarOwnership(Double carOwnership) { this.carOwnership = carOwnership; }
    }
}

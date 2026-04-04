package com.izikwen.mbtaoptimizer.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "zone_data")
public class ZoneData {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_set_id", nullable = false)
    private DataSet dataSet;

    @Column(nullable = false, length = 50)
    private String zoneId;

    @Column(nullable = false)
    private Double populationDensity;

    @Column(nullable = false)
    private Double jobDensity;

    @Column(nullable = false)
    private Double carOwnership;

    public ZoneData() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DataSet getDataSet() { return dataSet; }
    public void setDataSet(DataSet dataSet) { this.dataSet = dataSet; }
    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }
    public Double getPopulationDensity() { return populationDensity; }
    public void setPopulationDensity(Double populationDensity) { this.populationDensity = populationDensity; }
    public Double getJobDensity() { return jobDensity; }
    public void setJobDensity(Double jobDensity) { this.jobDensity = jobDensity; }
    public Double getCarOwnership() { return carOwnership; }
    public void setCarOwnership(Double carOwnership) { this.carOwnership = carOwnership; }
}

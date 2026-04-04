package com.izikwen.mbtaoptimizer.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "data_sets")
public class DataSet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false)
    private Boolean active = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DataSet() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}

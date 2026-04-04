package com.izikwen.mbtaoptimizer.repository;

import com.izikwen.mbtaoptimizer.entity.DataSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DataSetRepository extends JpaRepository<DataSet, Long> {
    Optional<DataSet> findByActiveTrue();
    List<DataSet> findAllByOrderByCreatedAtDesc();
}

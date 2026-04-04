package com.izikwen.mbtaoptimizer.repository;

import com.izikwen.mbtaoptimizer.entity.ZoneData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ZoneDataRepository extends JpaRepository<ZoneData, Long> {
    List<ZoneData> findByDataSet_Id(Long dataSetId);
    List<ZoneData> findByDataSet_IdAndZoneIdIn(Long dataSetId, List<String> zoneIds);
}

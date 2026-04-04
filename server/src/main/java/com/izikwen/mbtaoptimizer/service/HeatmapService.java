package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.response.ZoneDemandResponse;
import com.izikwen.mbtaoptimizer.dto.response.ZoneInfoResponse;
import com.izikwen.mbtaoptimizer.entity.DemandSnapshot;
import com.izikwen.mbtaoptimizer.repository.DemandSnapshotRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HeatmapService {

    private final ZoneService zoneService;
    private final DemandSnapshotRepository demandRepository;

    public HeatmapService(ZoneService zoneService, DemandSnapshotRepository demandRepository) {
        this.zoneService = zoneService;
        this.demandRepository = demandRepository;
    }

    public List<ZoneDemandResponse> getHeatmapZones(Integer timeOfDay) {
        List<ZoneInfoResponse> zones = zoneService.getZones();
        List<DemandSnapshot> snapshots = demandRepository.findByHourOfDay(timeOfDay);

        Map<String, Double> demandByArea = snapshots.stream()
                .collect(Collectors.groupingBy(
                        DemandSnapshot::getAreaCode,
                        Collectors.averagingDouble(DemandSnapshot::getDemandScore)
                ));

        List<ZoneDemandResponse> result = new ArrayList<>();
        for (ZoneInfoResponse zone : zones) {
            Double demand = demandByArea.getOrDefault(zone.getZoneId(), 0.0);
            result.add(new ZoneDemandResponse(
                    zone.getZoneId(), zone.getName(), demand,
                    zone.getCenterLat(), zone.getCenterLng()
            ));
        }
        return result;
    }
}

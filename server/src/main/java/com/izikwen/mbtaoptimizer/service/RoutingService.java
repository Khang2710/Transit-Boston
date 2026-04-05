package com.izikwen.mbtaoptimizer.service;

import com.izikwen.mbtaoptimizer.dto.request.RouteRequest;
import com.izikwen.mbtaoptimizer.dto.response.NetworkResponse;
import com.izikwen.mbtaoptimizer.dto.response.NetworkResponse.LineDto;
import com.izikwen.mbtaoptimizer.dto.response.NetworkResponse.StopDto;
import com.izikwen.mbtaoptimizer.dto.response.RouteResponse;
import com.izikwen.mbtaoptimizer.dto.response.RouteResponse.RouteSegment;
import com.izikwen.mbtaoptimizer.dto.response.RouteResponse.StopPoint;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Transit routing using Dijkstra on the MBTA network.
 *
 * Graph nodes: (lineId, stopIndex) pairs so we can track which line a stop belongs to.
 * Transfer edges added between stops that share the same mbtaStopId on different lines.
 */
@Service
public class RoutingService {

    private static final double TRANSFER_PENALTY_M = 500.0;   // ~5 min walk penalty
    private static final double WALK_TO_STOP_RADIUS_M = 800.0; // 0.5 mile radius to find nearby stops

    private final NetworkService networkService;

    public RoutingService(NetworkService networkService) {
        this.networkService = networkService;
    }

    public RouteResponse findRoute(RouteRequest req) {
        // Load all lines (0=LightRail, 1=HeavyRail, 3=Bus)
        NetworkResponse network = networkService.getNetwork("0,1,3");
        List<LineDto> lines = network.getLines();

        if (lines == null || lines.isEmpty()) {
            return emptyRoute("No transit network data available");
        }

        // ── 1. Build node map: nodeId = lineIndex * 100000 + stopIndex
        // ── Build adjacency list: nodeId -> list of (neighborNodeId, distM)
        Map<Integer, List<int[]>> adj = new HashMap<>();          // neighborNodeId, distMeters*100
        Map<Integer, StopInfo> nodeInfo = new HashMap<>();        // nodeId -> StopInfo
        // Group nodes by mbtaStopId for transfer edges
        Map<String, List<Integer>> stopIdToNodes = new HashMap<>();

        for (int li = 0; li < lines.size(); li++) {
            LineDto line = lines.get(li);
            List<StopDto> stops = line.getStops();
            if (stops == null) continue;

            for (int si = 0; si < stops.size(); si++) {
                StopDto stop = stops.get(si);
                int nodeId = li * 100000 + si;
                nodeInfo.put(nodeId, new StopInfo(li, si, stop, line));
                stopIdToNodes.computeIfAbsent(stop.getMbtaStopId(), k -> new ArrayList<>()).add(nodeId);
                adj.putIfAbsent(nodeId, new ArrayList<>());

                // Forward edge (stop si → si+1)
                if (si < stops.size() - 1) {
                    int nextId = li * 100000 + (si + 1);
                    double dist = haversine(stop.getLat(), stop.getLng(), stops.get(si + 1).getLat(), stops.get(si + 1).getLng());
                    adj.get(nodeId).add(new int[]{nextId, (int)(dist)});
                    adj.computeIfAbsent(nextId, k -> new ArrayList<>()).add(new int[]{nodeId, (int)(dist)});
                }
            }
        }

        // Transfer edges: same physical stop, different lines
        for (List<Integer> nodesAtStop : stopIdToNodes.values()) {
            for (int i = 0; i < nodesAtStop.size(); i++) {
                for (int j = i + 1; j < nodesAtStop.size(); j++) {
                    int a = nodesAtStop.get(i), b = nodesAtStop.get(j);
                    adj.get(a).add(new int[]{b, (int) TRANSFER_PENALTY_M});
                    adj.get(b).add(new int[]{a, (int) TRANSFER_PENALTY_M});
                }
            }
        }

        // ── 2. Find nearest stops to origin / destination
        List<Integer> originNodes = findNearestNodes(req.getOriginLat(), req.getOriginLng(), nodeInfo, WALK_TO_STOP_RADIUS_M, 5);
        List<Integer> destNodes = findNearestNodes(req.getDestLat(), req.getDestLng(), nodeInfo, WALK_TO_STOP_RADIUS_M, 5);

        if (originNodes.isEmpty() || destNodes.isEmpty()) {
            return emptyRoute("No transit stops found near origin or destination within " + (int)(WALK_TO_STOP_RADIUS_M) + "m");
        }

        Set<Integer> destSet = new HashSet<>(destNodes);

        // ── 3. Multi-source Dijkstra from all originNodes
        Map<Integer, Integer> dist = new HashMap<>();
        Map<Integer, Integer> prev = new HashMap<>();
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[1]));

        // Walk distance from origin to each origin node as initial cost
        for (int n : originNodes) {
            StopInfo si = nodeInfo.get(n);
            int walkCost = (int) haversine(req.getOriginLat(), req.getOriginLng(), si.stop.getLat(), si.stop.getLng());
            dist.put(n, walkCost);
            prev.put(n, -1);
            pq.offer(new int[]{n, walkCost});
        }

        int foundDest = -1;
        while (!pq.isEmpty()) {
            int[] curr = pq.poll();
            int u = curr[0], d = curr[1];
            if (dist.containsKey(u) && dist.get(u) < d) continue;
            if (destSet.contains(u)) { foundDest = u; break; }
            for (int[] edge : adj.getOrDefault(u, List.of())) {
                int v = edge[0], w = edge[1];
                int nd = d + w;
                if (!dist.containsKey(v) || nd < dist.get(v)) {
                    dist.put(v, nd);
                    prev.put(v, u);
                    pq.offer(new int[]{v, nd});
                }
            }
        }

        if (foundDest < 0) {
            // Fall back: pick the dest node with the smallest dist
            foundDest = destNodes.stream().filter(dist::containsKey)
                    .min(Comparator.comparingInt(dist::get)).orElse(-1);
        }
        if (foundDest < 0) {
            return emptyRoute("Could not find a transit path between origin and destination");
        }

        // ── 4. Reconstruct path
        List<Integer> path = new ArrayList<>();
        for (int cur = foundDest; cur != -1; cur = prev.getOrDefault(cur, -1)) {
            path.add(cur);
        }
        Collections.reverse(path);

        // ── 5. Group into segments (consecutive stops on same line)
        List<RouteSegment> segments = new ArrayList<>();
        if (!path.isEmpty()) {
            StopInfo first = nodeInfo.get(path.get(0));
            List<StopPoint> curStops = new ArrayList<>();
            curStops.add(toPoint(first.stop));
            String curLineId = first.line.getMbtaRouteId();
            String curLineName = first.line.getLineName();
            String curMode = first.line.getMode();
            String curColor = first.line.getColor();
            double segDistM = 0;

            for (int i = 1; i < path.size(); i++) {
                StopInfo si = nodeInfo.get(path.get(i));
                if (!si.line.getMbtaRouteId().equals(curLineId)) {
                    // Transfer: finalize current segment
                    segments.add(new RouteSegment(curLineId, curLineName, curMode, curColor, curStops));
                    curStops = new ArrayList<>();
                    curLineId = si.line.getMbtaRouteId();
                    curLineName = si.line.getLineName();
                    curMode = si.line.getMode();
                    curColor = si.line.getColor();
                }
                curStops.add(toPoint(si.stop));
                if (i > 0) {
                    StopInfo prev2 = nodeInfo.get(path.get(i - 1));
                    segDistM += haversine(prev2.stop.getLat(), prev2.stop.getLng(), si.stop.getLat(), si.stop.getLng());
                }
            }
            segments.add(new RouteSegment(curLineId, curLineName, curMode, curColor, curStops));

            int totalStops = path.size();
            int transfers = segments.size() - 1;
            double totalMi = (dist.get(foundDest) / 1.0) / 1609.34;
            String summary = buildSummary(segments);
            return new RouteResponse(segments, Math.round(totalMi * 100.0) / 100.0, totalStops, transfers, summary);
        }

        return emptyRoute("No path found");
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private List<Integer> findNearestNodes(double lat, double lng,
                                           Map<Integer, StopInfo> nodeInfo,
                                           double radiusM, int maxCount) {
        List<int[]> candidates = new ArrayList<>();
        for (Map.Entry<Integer, StopInfo> e : nodeInfo.entrySet()) {
            double d = haversine(lat, lng, e.getValue().stop.getLat(), e.getValue().stop.getLng());
            if (d <= radiusM) {
                candidates.add(new int[]{e.getKey(), (int) d});
            }
        }
        candidates.sort(Comparator.comparingInt(a -> a[1]));
        List<Integer> result = new ArrayList<>();
        for (int i = 0; i < Math.min(maxCount, candidates.size()); i++) {
            result.add(candidates.get(i)[0]);
        }
        return result;
    }

    private StopPoint toPoint(StopDto s) {
        return new StopPoint(s.getName(), s.getLat(), s.getLng());
    }

    private String buildSummary(List<RouteSegment> segments) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < segments.size(); i++) {
            RouteSegment seg = segments.get(i);
            if (i > 0) sb.append(" → Transfer → ");
            String boardAt = seg.getStops().isEmpty() ? "" : seg.getStops().get(0).getName();
            String alightAt = seg.getStops().isEmpty() ? "" : seg.getStops().get(seg.getStops().size() - 1).getName();
            sb.append(seg.getLineName()).append(" from ").append(boardAt).append(" to ").append(alightAt);
        }
        return sb.toString();
    }

    private RouteResponse emptyRoute(String msg) {
        return new RouteResponse(List.of(), 0, 0, 0, msg);
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Internal node metadata
    private record StopInfo(int lineIdx, int stopIdx, StopDto stop, LineDto line) {}
}

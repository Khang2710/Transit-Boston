package com.izikwen.mbtaoptimizer.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MbtaApiClient {

    private final RestClient restClient;

    public MbtaApiClient(RestClient.Builder builder,
                         @Value("${mbta.api-key:}") String apiKey) {
        RestClient.Builder b = builder.baseUrl("https://api-v3.mbta.com");
        if (apiKey != null && !apiKey.isBlank()) {
            b.defaultHeader("x-api-key", apiKey);
        }
        this.restClient = b.build();
    }

    public JsonNode getRoutes(String filterType) {
        String uri = filterType != null
                ? "/routes?filter[type]=" + filterType
                : "/routes";
        return restClient.get().uri(uri).retrieve().body(JsonNode.class);
    }

    public JsonNode getStopsForRoute(String routeId) {
        return restClient.get()
                .uri("/stops?filter[route]={routeId}&sort=name", routeId)
                .retrieve()
                .body(JsonNode.class);
    }

    public JsonNode getRoutePatterns(String routeId) {
        return restClient.get()
                .uri("/route_patterns?filter[route]={routeId}&include=representative_trip.stops", routeId)
                .retrieve()
                .body(JsonNode.class);
    }

    /**
     * Fetch all stops by route type in bulk.
     * routeType: 0=LightRail, 1=HeavyRail, 2=CommuterRail, 3=Bus, 4=Ferry
     */
    public JsonNode getAllStops(String routeType) {
        String uri = routeType != null
                ? "/stops?filter[route_type]=" + routeType + "&page[limit]=10000"
                : "/stops?page[limit]=10000";
        return restClient.get().uri(uri).retrieve().body(JsonNode.class);
    }
}

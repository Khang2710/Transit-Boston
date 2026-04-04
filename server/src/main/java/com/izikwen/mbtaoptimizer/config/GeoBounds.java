package com.izikwen.mbtaoptimizer.config;

/**
 * Metro Boston bounding box.
 * Covers: Downtown, Back Bay, South Boston, Dorchester, Roxbury, Jamaica Plain,
 *         Cambridge, Somerville, Charlestown, East Boston, Allston/Brighton,
 *         Brookline, Watertown edge, Medford edge, Quincy edge.
 * Excludes: Cape Cod, Worcester, North Shore, far south/west suburbs.
 */
public final class GeoBounds {
    private GeoBounds() {}

    public static final double MIN_LAT = 42.23;   // south (Quincy/Milton edge)
    public static final double MAX_LAT = 42.48;   // north (Medford/Malden edge)
    public static final double MIN_LNG = -71.19;  // west (Watertown/Newton edge)
    public static final double MAX_LNG = -70.99;  // east (East Boston/harbor)

    public static boolean inBounds(double lat, double lng) {
        return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
    }
}

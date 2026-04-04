insert into transit_stops (mbta_stop_id, name, mode, lat, lng, active, movable)
values
    ('place-aport', 'Airport', 'SUBWAY', 42.374262, -71.030395, true, true),
    ('place-andrw', 'Andrew', 'SUBWAY', 42.330154, -71.057655, true, true),
    ('place-aqucl', 'Aquarium', 'SUBWAY', 42.359784, -71.051652, true, true),
    ('place-armnl', 'Arlington', 'SUBWAY', 42.351902, -71.070893, true, true),
    ('place-asmnl', 'Ashmont', 'SUBWAY', 42.28452, -71.063777, true, true),
    ('place-astao', 'Assembly', 'SUBWAY', 42.392811, -71.077257, true, true),
    ('place-bbsta', 'Back Bay', 'SUBWAY', 42.34735, -71.075727, true, true),
    ('place-lake', 'Boston College', 'SUBWAY', 42.340081, -71.166769, true, true),
    ('place-boyls', 'Boylston', 'SUBWAY', 42.35302, -71.06459, true, true),
    ('place-brntn', 'Braintree', 'SUBWAY', 42.2078543, -71.0011385, true, true),
    ('place-chmnl', 'Charles/MGH', 'SUBWAY', 42.361166, -71.070628, true, true),
    ('place-chncl', 'Chinatown', 'SUBWAY', 42.352547, -71.062752, true, true),
    ('place-ccmnl', 'Community College', 'SUBWAY', 42.373622, -71.069533, true, true),
    ('place-cool', 'Coolidge Corner', 'SUBWAY', 42.342116, -71.121263, true, true),
    ('place-coecl', 'Copley', 'SUBWAY', 42.349951, -71.077424, true, true),
    ('place-dwnxg', 'Downtown Crossing', 'SUBWAY', 42.355518, -71.060225, true, true),
    ('place-esomr', 'East Somerville', 'SUBWAY', 42.379467, -71.086625, true, true),
    ('place-gover', 'Government Center', 'SUBWAY', 42.359705, -71.059215, true, true),
    ('place-hvdsq', 'Harvard', 'SUBWAY', 42.373362, -71.118956, true, true),
    ('place-jaksn', 'Jackson Square', 'SUBWAY', 42.323132, -71.099592, true, true),
    ('place-knncl', 'Kendall/MIT', 'SUBWAY', 42.3624908, -71.0861765, true, true),
    ('place-kencl', 'Kenmore', 'SUBWAY', 42.348949, -71.095451, true, true),
    ('place-mlmnl', 'Malden Center', 'SUBWAY', 42.426632, -71.07411, true, true),
    ('place-masta', 'Massachusetts Avenue', 'SUBWAY', 42.341512, -71.083423, true, true),
    ('place-mvbcl', 'Maverick', 'SUBWAY', 42.3691186, -71.0395296, true, true),
    ('place-mdftf', 'Medford/Tufts', 'SUBWAY', 42.407975, -71.117044, true, true),
    ('place-mfa', 'Museum of Fine Arts', 'SUBWAY', 42.337711, -71.095512, true, true),
    ('place-nqncy', 'North Quincy', 'SUBWAY', 42.275275, -71.029583, true, true),
    ('place-north', 'North Station', 'SUBWAY', 42.365577, -71.06129, true, true),
    ('place-nuniv', 'Northeastern University', 'SUBWAY', 42.340401, -71.088806, true, true),
    ('place-nubn', 'Nubian', 'SUBWAY', 42.329544, -71.083982, true, true),
    ('place-ogmnl', 'Oak Grove', 'SUBWAY', 42.43668, -71.071097, true, true),
    ('place-pktrm', 'Park Street', 'SUBWAY', 42.35639457, -71.0624242, true, true),
    ('place-rcmnl', 'Roxbury Crossing', 'SUBWAY', 42.331397, -71.095451, true, true),
    ('place-sstat', 'South Station', 'SUBWAY', 42.352271, -71.055242, true, true),
    ('place-state', 'State Street', 'SUBWAY', 42.358978, -71.057598, true, true),
    ('place-tumnl', 'Tufts Medical Center', 'SUBWAY', 42.349662, -71.063917, true, true),
    ('place-unsqu', 'Union Square', 'SUBWAY', 42.377359, -71.094761, true, true),
    ('place-welln', 'Wellington', 'SUBWAY', 42.40237, -71.077082, true, true),
    ('place-wondl', 'Wonderland', 'SUBWAY', 42.41342, -70.991648, true, true),
    ('place-wimnl', 'Wood Island', 'SUBWAY', 42.3796403, -71.0228654, true, true)

    on conflict do nothing;

insert into transit_routes (mbta_route_id, short_name, long_name, mode, color)
values
    ('Red', 'Red', 'Red Line', 'SUBWAY', 'DA291C'),
    ('Green-B', 'B', 'Green Line B', 'SUBWAY', '00843D'),
    ('Green-C', 'C', 'Green Line C', 'SUBWAY', '00843D'),
    ('Green-D', 'D', 'Green Line D', 'SUBWAY', '00843D'),
    ('Green-E', 'E', 'Green Line E', 'SUBWAY', '00843D'),
    ('Blue', 'Blue', 'Blue Line', 'SUBWAY', '003DA5'),
    ('Orange', 'Orange', 'Orange Line', 'SUBWAY', 'ED8B00'),
    ('Silver', 'Silver', 'Silver Line', 'SUBWAY', '000000'),
    ('Mattapan', 'Mattapan', 'Mattapan Line', 'SUBWAY', 'DA291C')
    on conflict do nothing;

--Downtown
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('downtown', 42.3555, -71.0620, 0.95, 08, 'DEMAND'),
    ('downtown', 42.3555, -71.0620, 0.98, 17, 'DEMAND'),
    ('downtown', 42.3555, -71.0620, 0.25, 22, 'DEMAND')
    on conflict do nothing;

-- North End
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('northend', 42.3647, -71.0542, 0.30, 09, 'DEMAND'),
    ('northend', 42.3647, -71.0542, 0.92, 19, 'DEMAND'),
    ('northend', 42.3647, -71.0542, 0.85, 21, 'DEMAND')
    on conflict do nothing;

-- Back Bay
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('backbay', 42.3484, -71.0825, 0.88, 12, 'DEMAND'),
    ('backbay', 42.3484, -71.0825, 0.90, 18, 'DEMAND'),
    ('backbay', 42.3484, -71.0825, 0.45, 10, 'DEMAND')
    on conflict do nothing;

-- Seaport
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('seaport', 42.3490, -71.0400, 0.85, 12, 'DEMAND'),
    ('seaport', 42.3490, -71.0400, 0.95, 20, 'DEMAND'),
    ('seaport', 42.3490, -71.0400, 0.15, 07, 'DEMAND')
    on conflict do nothing;

-- Fenway
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('fenway', 42.3467, -71.0972, 0.99, 19, 'DEMAND'),
    ('fenway', 42.3467, -71.0972, 0.60, 08, 'DEMAND'),
    ('fenway', 42.3467, -71.0972, 0.30, 23, 'DEMAND')
    on conflict do nothing;

-- Charlestown
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('charlestown', 42.3762, -71.0608, 0.90, 07, 'DEMAND'),
    ('charlestown', 42.3762, -71.0608, 0.85, 18, 'DEMAND'),
    ('charlestown', 42.3762, -71.0608, 0.20, 12, 'DEMAND')
    on conflict do nothing;

-- East Boston
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('eastboston', 42.3691, -71.0395, 0.75, 08, 'DEMAND'),
    ('eastboston', 42.3691, -71.0395, 0.80, 17, 'DEMAND'),
    ('eastboston', 42.3691, -71.0395, 0.50, 13, 'DEMAND')
    on conflict do nothing;

-- West End
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('westend', 42.3662, -71.0621, 0.96, 18, 'DEMAND'),
    ('westend', 42.3662, -71.0621, 0.70, 08, 'DEMAND'),
    ('westend', 42.3662, -71.0621, 0.40, 14, 'DEMAND')
    on conflict do nothing;

-- South End
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('southend', 42.3448, -71.0706, 0.82, 08, 'DEMAND'),
    ('southend', 42.3448, -71.0706, 0.90, 19, 'DEMAND'),
    ('southend', 42.3448, -71.0706, 0.50, 22, 'DEMAND')
    on conflict do nothing;

-- East Somerville
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('eastsomerville', 42.3794, -71.0866, 0.88, 08, 'DEMAND'),
    ('eastsomerville', 42.3794, -71.0866, 0.92, 17, 'DEMAND'),
    ('eastsomerville', 42.3794, -71.0866, 0.45, 13, 'DEMAND'),
    ('eastsomerville', 42.3810, -71.0900, 0.70, 18, 'DEMAND')
    on conflict do nothing;

-- Everett
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('everett', 42.3951, -71.0682, 0.92, 08, 'DEMAND'),
    ('everett', 42.3951, -71.0682, 0.98, 17, 'DEMAND'),
    ('everett', 42.3951, -71.0682, 0.95, 19, 'DEMAND'),
    ('everett', 42.3951, -71.0682, 0.40, 13, 'DEMAND'),
    ('everett', 42.3930, -71.0650, 0.85, 18, 'DEMAND'),
    ('everett', 42.3970, -71.0700, 0.80, 09, 'DEMAND')
    on conflict do nothing;

-- Revere Beach Parkway
insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
    ('reverebeachpkwy', 42.4042, -71.0600, 0.94, 08, 'DEMAND'),
    ('reverebeachpkwy', 42.4042, -71.0600, 0.97, 17, 'DEMAND'),
    ('reverebeachpkwy', 42.4015, -71.0350, 0.85, 08, 'DEMAND'),
    ('reverebeachpkwy', 42.4015, -71.0350, 0.89, 17, 'DEMAND'),
    ('reverebeachpkwy', 42.4085, -71.0118, 0.90, 15, 'DEMAND'),
    ('reverebeachpkwy', 42.4085, -71.0118, 0.30, 23, 'DEMAND'),
    ('reverebeachpkwy', 42.4050, -71.0450, 0.50, 13, 'DEMAND')
    on conflict do nothing;



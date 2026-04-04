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

insert into heatmap_cells (area_code, lat, lng, intensity, hour_of_day, metric_type)
values
('downtown', 42.3555, -71.0620, 0.92, 13, 'DEMAND'),
('downtown', 42.3548, -71.0614, 0.76, 13, 'DEMAND'),
('downtown', 42.3560, -71.0630, 0.68, 13, 'DEMAND')
on conflict do nothing;

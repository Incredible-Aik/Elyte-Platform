-- Ghana Locations Seed Data
-- Inserting major cities and regions in Ghana

INSERT INTO ghana_locations (region, city, district, latitude, longitude, population, is_capital) VALUES
-- Greater Accra Region
('Greater Accra', 'Accra', 'Accra Metropolitan', 5.6037, -0.1870, 2291352, true),
('Greater Accra', 'Tema', 'Tema Metropolitan', 5.6698, -0.0166, 402637, false),
('Greater Accra', 'Adenta', 'Adenta Municipal', 5.7095, -0.1709, 78215, false),
('Greater Accra', 'Ashaiman', 'Ashaiman Municipal', 5.6895, -0.0330, 190972, false),

-- Ashanti Region
('Ashanti', 'Kumasi', 'Kumasi Metropolitan', 6.6885, -1.6244, 2035064, false),
('Ashanti', 'Obuasi', 'Obuasi Municipal', 6.2027, -1.6708, 175043, false),
('Ashanti', 'Ejisu', 'Ejisu-Juaben Municipal', 6.7396, -1.3649, 143762, false),

-- Western Region
('Western', 'Takoradi', 'Sekondi-Takoradi Metropolitan', 4.8845, -1.7554, 445205, false),
('Western', 'Sekondi', 'Sekondi-Takoradi Metropolitan', 4.9344, -1.7108, 445205, false),
('Western', 'Tarkwa', 'Tarkwa-Nsuaem Municipal', 5.3006, -1.9954, 58672, false),

-- Northern Region
('Northern', 'Tamale', 'Tamale Metropolitan', 9.4034, -0.8424, 371351, false),
('Northern', 'Yendi', 'Yendi Municipal', 9.4427, -0.0107, 117780, false),

-- Central Region
('Central', 'Cape Coast', 'Cape Coast Metropolitan', 5.1053, -1.2466, 169894, false),
('Central', 'Winneba', 'Effutu Municipal', 5.3511, -0.6136, 62016, false),

-- Eastern Region
('Eastern', 'Koforidua', 'New-Juaben Municipal', 6.0889, -0.2582, 120971, false),
('Eastern', 'Akosombo', 'Asuogyaman District', 6.2598, -0.0451, 18000, false),

-- Volta Region
('Volta', 'Ho', 'Ho Municipal', 6.6108, 0.4712, 119618, false),
('Volta', 'Hohoe', 'Hohoe Municipal', 7.1510, 0.4599, 56202, false),

-- Upper East Region
('Upper East', 'Bolgatanga', 'Bolgatanga Municipal', 10.7856, -0.8513, 131550, false),
('Upper East', 'Navrongo', 'Kassena-Nankana Municipal', 10.8955, -1.0932, 27306, false),

-- Upper West Region
('Upper West', 'Wa', 'Wa Municipal', 10.0600, -2.5057, 102446, false),

-- Brong-Ahafo Region
('Brong-Ahafo', 'Sunyani', 'Sunyani Municipal', 7.3390, -2.3264, 123224, false),
('Brong-Ahafo', 'Techiman', 'Techiman Municipal', 7.5885, -1.9287, 104212, false),

-- Western North Region
('Western North', 'Sefwi Wiawso', 'Wiawso Municipal', 6.2133, -2.4844, 46522, false),

-- Ahafo Region
('Ahafo', 'Goaso', 'Asutifi South District', 6.7983, -2.5403, 34311, false),

-- Bono Region
('Bono', 'Sunyani', 'Sunyani Municipal', 7.3390, -2.3264, 123224, false),

-- Bono East Region
('Bono East', 'Techiman', 'Techiman Municipal', 7.5885, -1.9287, 104212, false),

-- Oti Region
('Oti', 'Dambai', 'Krachi East Municipal', 8.1333, 0.4833, 25000, false),

-- North East Region
('North East', 'Nalerigu', 'Mamprugu Moagduri District', 10.5333, -0.3667, 8500, false),

-- Savannah Region
('Savannah', 'Damongo', 'West Gonja Municipal', 9.0833, -1.8167, 35000, false);
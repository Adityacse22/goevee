-- Seed realistic EV charging stations across Delhi-NCR for testing.
-- These are approximate locations of real EV charging areas.

INSERT INTO stations (name, address, city, state, country, pincode, latitude, longitude, status)
VALUES
  -- Central Delhi
  ('Tata Power EV - Connaught Place', 'Block A, Connaught Place, New Delhi', 'New Delhi', 'Delhi', 'India', '110001', '28.6315', '77.2167', 'ACTIVE'),
  ('EESL Charging Hub - India Gate', 'Rajpath Area, India Gate, New Delhi', 'New Delhi', 'Delhi', 'India', '110003', '28.6129', '77.2295', 'ACTIVE'),

  -- South Delhi
  ('Fortum Charge & Drive - Saket', 'Select Citywalk Mall, Saket, New Delhi', 'New Delhi', 'Delhi', 'India', '110017', '28.5285', '77.2190', 'ACTIVE'),
  ('ChargeZone - Nehru Place', 'Nehru Place IT Hub, New Delhi', 'New Delhi', 'Delhi', 'India', '110019', '28.5491', '77.2533', 'ACTIVE'),

  -- North Delhi
  ('Ather Grid - Rohini', 'Sector 10, Rohini, New Delhi', 'New Delhi', 'Delhi', 'India', '110085', '28.7325', '77.1144', 'ACTIVE'),

  -- Gurgaon
  ('Tata Power EV - Cyber Hub', 'Cyber Hub, DLF Cyber City, Gurgaon', 'Gurgaon', 'Haryana', 'India', '122002', '28.4949', '77.0880', 'ACTIVE'),
  ('MG Motor Charging - Golf Course Road', 'Golf Course Road, Gurgaon', 'Gurgaon', 'Haryana', 'India', '122018', '28.4563', '77.0956', 'ACTIVE'),

  -- Noida
  ('EESL Charging Station - Noida Sec 18', 'Sector 18, Noida', 'Noida', 'Uttar Pradesh', 'India', '201301', '28.5708', '77.3219', 'ACTIVE'),
  ('Statiq EV Charger - Noida Expressway', 'Noida Expressway, Sector 62', 'Noida', 'Uttar Pradesh', 'India', '201309', '28.6270', '77.3654', 'ACTIVE'),

  -- Sonipat / Panipat corridor (near Samalkha)
  ('EV Station - Sonipat', 'GT Road, Sonipat', 'Sonipat', 'Haryana', 'India', '131001', '28.9931', '77.0151', 'ACTIVE'),
  ('Highway EV Charger - Panipat', 'NH-44, Panipat', 'Panipat', 'Haryana', 'India', '132103', '29.3909', '76.9635', 'ACTIVE'),
  ('Green Charge - Samalkha', 'Main Market, Samalkha, Panipat', 'Samalkha', 'Haryana', 'India', '132101', '29.0031', '76.9607', 'ACTIVE'),

  -- Faridabad
  ('Tata Power - Faridabad', 'Sector 15, Faridabad', 'Faridabad', 'Haryana', 'India', '121007', '28.4089', '77.3178', 'ACTIVE'),

  -- Greater Noida
  ('Statiq - Pari Chowk', 'Pari Chowk, Greater Noida', 'Greater Noida', 'Uttar Pradesh', 'India', '201310', '28.4744', '77.5040', 'ACTIVE')

ON CONFLICT DO NOTHING;

-- Add sample chargers for the new stations
INSERT INTO chargers (station_id, charger_code, connector_type, power_output_kw, status)
SELECT s.id, 'CHG-' || LEFT(s.id::text, 4) || '-A', 'CCS2', '50', 'AVAILABLE'
FROM stations s
WHERE NOT EXISTS (
  SELECT 1 FROM chargers c WHERE c.station_id = s.id
);

INSERT INTO chargers (station_id, charger_code, connector_type, power_output_kw, status)
SELECT s.id, 'CHG-' || LEFT(s.id::text, 4) || '-B', 'Type 2 AC', '22', 'AVAILABLE'
FROM stations s
WHERE (SELECT COUNT(*) FROM chargers c WHERE c.station_id = s.id) < 2;

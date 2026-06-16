CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Laval',
  province TEXT DEFAULT 'QC',
  postal_code TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  height_m DECIMAL(6,2),
  floors INTEGER,
  year_built INTEGER,
  usage_type TEXT,
  segment TEXT,
  zone TEXT,
  priority TEXT DEFAULT 'medium',
  score_anciennete INTEGER DEFAULT 0,
  score_usage INTEGER DEFAULT 0,
  score_hauteur INTEGER DEFAULT 0,
  score_total INTEGER DEFAULT 0,
  owner_name TEXT,
  owner_contact TEXT,
  management_company TEXT,
  management_contact TEXT,
  fire_system_type TEXT,
  fire_system_status TEXT,
  last_inspection_date DATE,
  next_inspection_date DATE,
  number_of_units INTEGER,
  building_type TEXT,
  assessed_value DECIMAL(12,2),
  notes TEXT,
  source TEXT DEFAULT 'prospection',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE building_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'streetview',
  source TEXT DEFAULT 'google_streetview',
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  captured_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE building_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  contact_type TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspection_type TEXT,
  status TEXT DEFAULT 'scheduled',
  findings TEXT,
  recommendations TEXT,
  inspector_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_buildings_city ON buildings(city);
CREATE INDEX idx_buildings_priority ON buildings(priority);
CREATE INDEX idx_buildings_segment ON buildings(segment);
CREATE INDEX idx_buildings_zone ON buildings(zone);
CREATE INDEX idx_building_images_building ON building_images(building_id);
CREATE INDEX idx_building_contacts_building ON building_contacts(building_id);
CREATE INDEX idx_inspections_building ON inspections(building_id);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read buildings" ON buildings FOR SELECT USING (true);
CREATE POLICY "Public read images" ON building_images FOR SELECT USING (true);
CREATE POLICY "Public read contacts" ON building_contacts FOR SELECT USING (true);
CREATE POLICY "Public read inspections" ON inspections FOR SELECT USING (true);

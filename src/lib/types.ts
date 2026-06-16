export type Building = {
  id: string;
  external_id: string | null;
  name: string;
  address: string;
  city: string;
  province: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  height_m: number | null;
  floors: number | null;
  year_built: number | null;
  usage_type: string | null;
  segment: string | null;
  zone: string | null;
  priority: string | null;
  score_anciennete: number | null;
  score_usage: number | null;
  score_hauteur: number | null;
  score_total: number | null;
  owner_name: string | null;
  owner_contact: string | null;
  management_company: string | null;
  management_contact: string | null;
  fire_system_type: string | null;
  fire_system_status: string | null;
  last_inspection_date: string | null;
  next_inspection_date: string | null;
  number_of_units: number | null;
  building_type: string | null;
  assessed_value: number | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type BuildingImage = {
  id: string;
  building_id: string;
  image_url: string;
  image_type: string | null;
  source: string | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  captured_at: string | null;
  created_at: string;
};

export type BuildingContact = {
  id: string;
  building_id: string;
  contact_type: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
};

export type Inspection = {
  id: string;
  building_id: string;
  inspection_date: string;
  inspection_type: string | null;
  status: string | null;
  findings: string | null;
  recommendations: string | null;
  inspector_name: string | null;
  created_at: string;
};

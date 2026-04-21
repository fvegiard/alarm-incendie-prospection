const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const newBuildings = [
  {
    "id": 101,
    "rang": 75,
    "immeuble": "Urbania Condos (Laval)",
    "hauteur_m": 50,
    "etages": 16,
    "annee": 2010,
    "usage": "Residential",
    "latitude": 45.5606,
    "longitude": -73.7145,
    "zone": "Laval - Centre",
    "zone_lettre": "L",
    "age_2026": 16,
    "score_anciennete": 2,
    "score_usage": 1,
    "score_hauteur": 1,
    "score_total": 4,
    "priorite": "Moyenne",
    "statut_public": "Validation requise",
    "decideur_probable": "Syndicat de copropriété",
    "angle_commercial": "Maintenance et validation",
    "raison_priorisation": "Condo",
    "mode_action": "Validation",
    "segment": "Syndicat / condo"
  },
  {
    "id": 102,
    "rang": 76,
    "immeuble": "Complexe Saint-Charles (Longueuil)",
    "hauteur_m": 80,
    "etages": 25,
    "annee": 1990,
    "usage": "Office / Residential",
    "latitude": 45.5348,
    "longitude": -73.5135,
    "zone": "Longueuil - Métro",
    "zone_lettre": "S",
    "age_2026": 36,
    "score_anciennete": 4,
    "score_usage": 3,
    "score_hauteur": 2,
    "score_total": 9,
    "priorite": "Élevée",
    "statut_public": "1999 et antérieur – audit prioritaire",
    "decideur_probable": "Gestionnaire",
    "angle_commercial": "Audit prioritaire",
    "raison_priorisation": "Ancien, multi-usage",
    "mode_action": "Audit prioritaire",
    "segment": "Commercial / institutionnel"
  },
  {
    "id": 103,
    "rang": 77,
    "immeuble": "Tour Port-de-Mer (Longueuil)",
    "hauteur_m": 90,
    "etages": 28,
    "annee": 1974,
    "usage": "Residential",
    "latitude": 45.5350,
    "longitude": -73.5110,
    "zone": "Longueuil - Métro",
    "zone_lettre": "S",
    "age_2026": 52,
    "score_anciennete": 5,
    "score_usage": 2,
    "score_hauteur": 3,
    "score_total": 10,
    "priorite": "Très élevée",
    "statut_public": "Audit très urgent",
    "decideur_probable": "Syndicat / Gestionnaire",
    "angle_commercial": "Très ancien bâtiment de grande hauteur",
    "raison_priorisation": "Âge critique",
    "mode_action": "Audit prioritaire",
    "segment": "Syndicat / condo"
  },
  {
    "id": 104,
    "rang": 78,
    "immeuble": "Hôpital Charles-Le Moyne (Longueuil)",
    "hauteur_m": 45,
    "etages": 10,
    "annee": 1966,
    "usage": "Institutionnel",
    "latitude": 45.4950,
    "longitude": -73.4739,
    "zone": "Longueuil - Greenfield Park",
    "zone_lettre": "S",
    "age_2026": 60,
    "score_anciennete": 5,
    "score_usage": 5,
    "score_hauteur": 1,
    "score_total": 11,
    "priorite": "Très élevée",
    "statut_public": "Audit très urgent",
    "decideur_probable": "CISSS de la Montérégie-Centre",
    "angle_commercial": "Secteur santé critique",
    "raison_priorisation": "Hôpital très ancien",
    "mode_action": "Audit prioritaire",
    "segment": "Commercial / institutionnel"
  },
  {
    "id": 105,
    "rang": 79,
    "immeuble": "Solar Uniquartier - Tour Magellan (Brossard)",
    "hauteur_m": 60,
    "etages": 20,
    "annee": 2021,
    "usage": "Residential",
    "latitude": 45.4452,
    "longitude": -73.4357,
    "zone": "Brossard - Dix30",
    "zone_lettre": "S",
    "age_2026": 5,
    "score_anciennete": 1,
    "score_usage": 1,
    "score_hauteur": 2,
    "score_total": 4,
    "priorite": "Basse",
    "statut_public": "Nouveau",
    "decideur_probable": "Syndicat / Gestionnaire",
    "angle_commercial": "Information et validation future",
    "raison_priorisation": "Nouveau bâtiment",
    "mode_action": "Information",
    "segment": "Syndicat / condo"
  }
];

async function addBuildings() {
  console.log("Injecting new Laval and South Shore buildings...");
  const { data, error } = await supabase.from('buildings').upsert(newBuildings, { onConflict: 'id' });
  if (error) {
    console.error("Error inserting buildings:", error);
  } else {
    console.log("Successfully injected 5 new buildings from Laval and South Shore!");
  }
}

addBuildings();

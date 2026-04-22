const fs = require('fs');

const dataPath = 'data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const newBuildings = [
    {
        name: "900 Saint-Jacques (Moxy Hotel)",
        type: "Mixed-use High-rise",
        year: 2026,
        city: "Montreal",
        lat: 45.498,
        lng: -73.565,
        height: 160,
        floors: 48,
        usage: "Mixed (Hotel/Residential)",
        zone: "Z - Downtown Core",
        zone_lettre: "Z",
        statut: "Completion 2026"
    },
    {
        name: "voco Montréal (Palais des Congrès)",
        type: "Hotel",
        year: 2026,
        city: "Montreal",
        lat: 45.503,
        lng: -73.562,
        height: 45,
        floors: 12,
        usage: "Hotel",
        zone: "Z - Old Montreal / Downtown",
        zone_lettre: "Z",
        statut: "New Build 2026"
    },
    {
        name: "Casino de Montréal Hotel (Germain)",
        type: "Luxury Hotel",
        year: 2026,
        city: "Montreal",
        lat: 45.505,
        lng: -73.525,
        height: 60,
        floors: 15,
        usage: "Hotel",
        zone: "Z - Parc Jean-Drapeau",
        zone_lettre: "Z",
        statut: "Target 2026"
    },
    {
        name: "Royalmount Hospitality Hub",
        type: "Hotel",
        year: 2026,
        city: "Montreal",
        lat: 45.495,
        lng: -73.655,
        height: 70,
        floors: 18,
        usage: "Hotel",
        zone: "Z - Royalmount / TMR",
        zone_lettre: "Z",
        statut: "Target 2026"
    },
    {
        name: "40NetZero Montréal-Est",
        type: "Industrial Campus",
        year: 2026,
        city: "Montreal",
        lat: 45.63,
        lng: -73.50,
        height: 15,
        floors: 2,
        usage: "Industrial",
        zone: "Z - Montréal-Est Industrial",
        zone_lettre: "Z",
        statut: "Carbon-Neutral Site 2026"
    },
    {
        name: "Carré Laval Flagship",
        type: "Mixed-use",
        year: 2026,
        city: "Laval",
        lat: 45.56,
        lng: -73.74,
        height: 50,
        floors: 15,
        usage: "Mixed-use",
        zone: "Laval - Centre-ville",
        zone_lettre: "L",
        statut: "Active Site 2026"
    },
    {
        name: "Carrefour Laval Residential Towers",
        type: "Residential Rental",
        year: 2026,
        city: "Laval",
        lat: 45.56,
        lng: -73.75,
        height: 65,
        floors: 20,
        usage: "Residential",
        zone: "Laval - Chomedey",
        zone_lettre: "L",
        statut: "Phase 1 - 2026/2027"
    },
    {
        name: "Habitation Palerme (Social Housing)",
        type: "Residential",
        year: 2026,
        city: "Laval",
        lat: 45.55,
        lng: -73.72,
        height: 25,
        floors: 6,
        usage: "Social Housing",
        zone: "Laval - Sud",
        zone_lettre: "L",
        statut: "Delivery 2026"
    },
    {
        name: "Rosefellow Boisbriand Industrial",
        type: "Industrial",
        year: 2026,
        city: "North Shore",
        lat: 45.61,
        lng: -73.83,
        height: 15,
        floors: 1,
        usage: "Industrial",
        zone: "Rive-Nord",
        zone_lettre: "RN",
        statut: "Completion 2026"
    }
];

let nextId = Math.max(...data.inventory.map(b => b.id)) + 1;

newBuildings.forEach(b => {
    const exists = data.inventory.some(existing => existing.immeuble.toLowerCase().includes(b.name.toLowerCase().split('(')[0].trim()));
    if (!exists) {
        console.log(`✅ Adding building: ${b.name}`);
        data.inventory.push({
            id: nextId++,
            rang: 99,
            immeuble: b.name,
            hauteur_m: b.height,
            etages: b.floors,
            annee: b.year,
            usage: b.usage,
            latitude: b.lat,
            longitude: b.lng,
            zone: b.zone,
            zone_lettre: b.zone_lettre,
            age_2026: 0,
            score_total: 8,
            priorite: "Élevée",
            statut_public: b.statut,
            decideur_probable: "Promoteur / Direction Technique",
            angle_commercial: "Validation système alarme incendie - Nouveau projet",
            raison_priorisation: "Livraison 2026 - Opportunité immédiate",
            mode_action: "Prise de contact directe",
            segment: b.usage.includes("Residential") ? "Syndicat / condo" : "Commercial / institutionnel",
            top25_ordre: null,
            condo_ordre: null,
            image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random&size=200`,
            contact_info: "Veille 2026 - Bureau de vente"
        });
    } else {
        console.log(`⏭️ Skipping duplicate: ${b.name}`);
    }
});

data.meta.total_tours = data.inventory.length;
data.meta.top_prioritaires = data.inventory.filter(b => b.priorite === "Très élevée" || b.priorite === "Élevée").length;
data.meta.date_generation = new Date().toISOString().split('T')[0];

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✨ Done. New total: ${data.meta.total_tours}`);

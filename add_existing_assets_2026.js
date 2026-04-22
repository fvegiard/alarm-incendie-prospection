const fs = require('fs');

const dataPath = 'data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const existingAssets = [
    {
        name: "Place Ville Marie (PVM)",
        type: "Mega-Complex (5 towers)",
        year: 1962,
        city: "Montreal",
        lat: 45.501,
        lng: -73.568,
        height: 188,
        floors: 47,
        usage: "Office / Commercial",
        zone: "Z - Downtown Core",
        zone_lettre: "Z",
        statut: "Maintenance Annuelle 2026"
    },
    {
        name: "Le Nordelec",
        type: "Mixed-use Complex",
        year: 1913,
        city: "Montreal",
        lat: 45.485,
        lng: -73.575,
        height: 40,
        floors: 8,
        usage: "Office / Residential",
        zone: "Z - Sud-Ouest",
        zone_lettre: "Z",
        statut: "Audit / Inspection 2026"
    },
    {
        name: "Place Laval (Tours 1-5)",
        type: "Office Complex",
        year: 1975,
        city: "Laval",
        lat: 45.565,
        lng: -73.715,
        height: 55,
        floors: 14,
        usage: "Office",
        zone: "Laval - Centre-ville",
        zone_lettre: "L",
        statut: "Maintenance System 2026"
    },
    {
        name: "Victoria sur le Parc",
        type: "Skyscraper",
        year: 2024,
        city: "Montreal",
        lat: 45.500,
        lng: -73.561,
        height: 200,
        floors: 58,
        usage: "Residential / Commercial",
        zone: "Z - Downtown Core",
        zone_lettre: "Z",
        statut: "Garantie / Service 2026"
    },
    {
        name: "Maestria (Tours Jumeaux)",
        type: "Residential",
        year: 2024,
        city: "Montreal",
        lat: 45.507,
        lng: -73.566,
        height: 202,
        floors: 61,
        usage: "Residential",
        zone: "Z - Quartier des Spectacles",
        zone_lettre: "Z",
        statut: "Maintenance / Certification 2026"
    },
    {
        name: "1 Square Phillips",
        type: "Residential Skyscraper",
        year: 2025,
        city: "Montreal",
        lat: 45.503,
        lng: -73.569,
        height: 232,
        floors: 61,
        usage: "Residential",
        zone: "Z - Downtown Core",
        zone_lettre: "Z",
        statut: "Entretien Préventif 2026"
    },
    {
        name: "Siège Social Banque Nationale",
        type: "Office Tower",
        year: 2025,
        city: "Montreal",
        lat: 45.499,
        lng: -73.563,
        height: 200,
        floors: 40,
        usage: "Office",
        zone: "Z - Financial District",
        zone_lettre: "Z",
        statut: "Full System Audit 2026"
    },
    {
        name: "Mostra Centropolis",
        type: "Residential Complex",
        year: 2026,
        city: "Laval",
        lat: 45.56,
        lng: -73.74,
        height: 40,
        floors: 12,
        usage: "Residential",
        zone: "Laval - Chomedey",
        zone_lettre: "L",
        statut: "Mise en service Finale 2026"
    },
    {
        name: "Central Parc Laval",
        type: "Residential Rental",
        year: 2025,
        city: "Laval",
        lat: 45.562,
        lng: -73.745,
        height: 45,
        floors: 15,
        usage: "Residential",
        zone: "Laval - Centre-ville",
        zone_lettre: "L",
        statut: "Service de Maintenance 2026"
    }
];

let nextId = Math.max(...data.inventory.map(b => b.id)) + 1;

existingAssets.forEach(b => {
    const exists = data.inventory.some(existing => existing.immeuble.toLowerCase().includes(b.name.split('(')[0].trim().toLowerCase()));
    if (!exists) {
        console.log(`✅ Adding asset: ${b.name}`);
        data.inventory.push({
            id: nextId++,
            rang: b.height > 150 ? 5 : 15,
            immeuble: b.name,
            hauteur_m: b.height,
            etages: b.floors,
            annee: b.year,
            usage: b.usage,
            latitude: b.lat,
            longitude: b.lng,
            zone: b.zone,
            zone_lettre: b.zone_lettre,
            age_2026: 2026 - b.year,
            score_total: b.height > 150 ? 9.5 : 8.5,
            priorite: b.height > 150 ? "Très élevée" : "Élevée",
            statut_public: b.statut,
            decideur_probable: "Gestionnaire Immobilier (Mach / CF / Ivanhoé)",
            angle_commercial: "Renouvellement contrat maintenance / Inspection annuelle",
            raison_priorisation: "Atout Majeur - Certification CAN/ULC-S536 requise",
            mode_action: "Appel d'offres / Relation B2B",
            segment: b.usage.includes("Residential") ? "Syndicat / condo" : "Commercial / institutionnel",
            top25_ordre: b.height > 150 ? 1 : null,
            condo_ordre: b.usage.includes("Residential") ? 1 : null,
            image_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random&size=200`,
            contact_info: "Ivanhoé Cambridge / Groupe Mach / Cadillac Fairview"
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

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const PRIORITY_MAP: Record<string, string> = {
  'Faible': 'low',
  'Moyenne': 'medium',
  'Élevée': 'high',
  'Très élevée': 'critical',
};

function normalizePriority(p: string | null): string {
  if (!p) return 'medium';
  return PRIORITY_MAP[p] || p.toLowerCase().replace(/\s+/g, '-');
}

function isPlaceholderImage(img: string): boolean {
  if (!img) return true;
  if (img.includes('ui-avatars.com')) return true;
  const filePath = path.join(process.cwd(), 'public', 'building-photos', path.basename(img));
  if (!fs.existsSync(filePath)) return true;
  const size = fs.statSync(filePath).size;
  if (size < 8192) return true;
  return false;
}

async function main() {
  const raw = fs.readFileSync(path.join(process.cwd(), 'data.json'), 'utf8');
  const data = JSON.parse(raw);
  const inventory: any[] = data.inventory;

  for (const b of inventory) {
    const externalId = String(b.id);
    const city = b.zone && String(b.zone).includes('Laval') ? 'Laval' : 'Montréal';
    const segment = b.segment === 'Syndicat / condo' ? 'Condo' : (b.segment || 'Other');

    const building = await prisma.building.upsert({
      where: { externalId },
      update: {
        name: b.immeuble || undefined,
        address: b.immeuble || undefined,
        city,
        latitude: b.latitude ?? undefined,
        longitude: b.longitude ?? undefined,
        heightM: b.hauteur_m ?? undefined,
        floors: b.etages ?? undefined,
        yearBuilt: b.annee ?? undefined,
        segment,
        zone: b.zone || undefined,
        priority: normalizePriority(b.priorite),
        scoreAnciennete: b.score_anciennete ?? undefined,
        scoreUsage: b.score_usage ?? undefined,
        scoreHauteur: b.score_hauteur ?? undefined,
        scoreTotal: b.score_total ?? undefined,
        ownerName: b.owner || undefined,
        managementCompany: b.management_company || undefined,
        notes: b.raison_priorisation || undefined,
      },
      create: {
        externalId,
        name: b.immeuble || 'Unknown',
        address: b.immeuble || 'Unknown',
        city,
        province: 'QC',
        latitude: b.latitude ?? null,
        longitude: b.longitude ?? null,
        heightM: b.hauteur_m ?? null,
        floors: b.etages ?? null,
        yearBuilt: b.annee ?? null,
        usageType: b.usage ? b.usage.toLowerCase() : 'unknown',
        segment,
        zone: b.zone || null,
        priority: normalizePriority(b.priorite),
        scoreAnciennete: b.score_anciennete ?? 0,
        scoreUsage: b.score_usage ?? 0,
        scoreHauteur: b.score_hauteur ?? 0,
        scoreTotal: b.score_total ?? 0,
        ownerName: b.owner || null,
        ownerContact: b.contact_info || null,
        managementCompany: b.management_company || null,
        managementContact: b.website || null,
        fireSystemType: 'unknown',
        fireSystemStatus: 'unknown',
        notes: b.raison_priorisation || null,
      },
    });

    const legacyImage = b.image_url || `images/buildings/${b.id}.jpg`;
    const isPlaceholder = isPlaceholderImage(legacyImage);
    const publicPath = `/building-photos/${path.basename(legacyImage)}`;

    await prisma.buildingImage.upsert({
      where: { id: `legacy-${b.id}` },
      update: {
        imageUrl: publicPath,
        imageType: isPlaceholder ? 'placeholder' : 'legacy',
        source: isPlaceholder ? 'ui-avatars_placeholder' : 'legacy_local',
        isPrimary: !isPlaceholder,
      },
      create: {
        id: `legacy-${b.id}`,
        buildingId: building.id,
        imageUrl: publicPath,
        imageType: isPlaceholder ? 'placeholder' : 'legacy',
        source: isPlaceholder ? 'ui-avatars_placeholder' : 'legacy_local',
        isPrimary: !isPlaceholder,
      },
    });
  }

  console.log(`Seeded/updated ${inventory.length} buildings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

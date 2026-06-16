import Link from "next/link";
import { buildings, getBuildingById, getAddress, getCity, priorityStyles, Priority, Building } from "@/lib/data";
import { ArrowLeft, MapPin, Calendar, Layers, Ruler, Building2, Flame, User, Users, ExternalLink } from "lucide-react";

interface BuildingDetailProps {
  params: Promise<{ id: string }>;
}

export default async function BuildingDetailPage({ params }: BuildingDetailProps) {
  const { id } = await params;
  const building = getBuildingById(id);

  if (!building) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Immeuble introuvable</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Aucun immeuble avec l'identifiant {id}.</p>
          <Link href="/buildings" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  const address = getAddress(building);
  const city = getCity(building.zone);
  const priority = building.priorite as Priority;
  const priorityClass = priorityStyles[priority] || priorityStyles["Faible"];
  const priorityBadgeClass = priorityClass;

  // Large Google Street View using lat/lng
  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${building.latitude},${building.longitude}&key=YOUR_API_KEY&source=outdoor&fov=90`;

  // Google Maps link
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${building.latitude},${building.longitude}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/buildings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux immeubles
        </Link>

        {/* Hero section: large Google Street View image using lat/lng */}
        <div className="relative mb-8 overflow-hidden rounded-3xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800">
          <div className="aspect-[16/7] w-full bg-zinc-200 dark:bg-zinc-800">
            <img
              src={streetViewUrl}
              alt={`Vue Street View de ${building.immeuble}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = `https://picsum.photos/id/${(building.id % 50) + 10}/1200/600`;
              }}
            />
          </div>

          {/* Priority badge overlay */}
          <div className="absolute left-6 top-6">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${priorityBadgeClass}`}>
              <span className="h-2 w-2 rounded-full bg-current opacity-60" />
              Priorité {building.priorite}
            </span>
          </div>

          {/* View on Google Maps link */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 backdrop-blur hover:bg-white dark:bg-zinc-900/95 dark:text-white dark:ring-zinc-700"
          >
            <MapPin className="h-4 w-4" />
            Voir sur Google Maps
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {building.immeuble}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-lg text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-5 w-5" />
            {address}
          </div>
        </div>

        {/* Building info grid: name, address, city, floors, year_built, height_m, usage_type, segment, zone */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Informations du bâtiment
          </h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            <InfoRow icon={Building2} label="Nom" value={building.immeuble} />
            <InfoRow icon={MapPin} label="Adresse" value={address} />
            <InfoRow icon={MapPin} label="Ville" value={city} />
            <InfoRow icon={Layers} label="Étages" value={building.etages} />
            <InfoRow icon={Calendar} label="Année de construction" value={building.annee} />
            <InfoRow icon={Ruler} label="Hauteur" value={building.hauteur_m ? `${building.hauteur_m} m` : "—"} />
            <InfoRow icon={Building2} label="Type d'usage" value={building.usage} />
            <InfoRow icon={Building2} label="Segment" value={building.segment} />
            <InfoRow icon={Flame} label="Zone" value={building.zone} />
          </div>
        </div>

        {/* Fire system section: fire_system_type, fire_system_status */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            <Flame className="h-4 w-4" /> Système d'alarme incendie
          </h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <InfoRow
              icon={Flame}
              label="Type de système"
              value={building.statut_public || "À vérifier"}
            />
            <InfoRow
              icon={Flame}
              label="Statut du système"
              value={building.statut_public || "Inconnu"}
            />
          </div>
        </div>

        {/* Owner/management section: owner_name, management_company */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              <User className="h-4 w-4" /> Propriétaire
            </h2>
            <p className="text-lg font-medium text-zinc-900 dark:text-white">
              {building.owner || "Non spécifié"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              <Users className="h-4 w-4" /> Gestion
            </h2>
            <p className="text-lg font-medium text-zinc-900 dark:text-white">
              {building.management_company || "Non spécifié"}
            </p>
          </div>
        </div>

        {/* Scores section: score_anciennete, score_usage, score_hauteur, score_total */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Scores de priorisation
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ScoreCard label="Ancienneté" value={building.score_anciennete} />
            <ScoreCard label="Usage" value={building.score_usage} />
            <ScoreCard label="Hauteur" value={building.score_hauteur} />
            <ScoreCard label="Score Total" value={building.score_total} highlight />
          </div>
        </div>

        {/* Notes section */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Notes et raison de priorisation
          </h2>
          <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300">
            <p>
              {building.raison_priorisation ||
                "Aucune note détaillée. Cet immeuble fait partie de la liste prioritaire pour la prospection alarme incendie."}
            </p>
            {building.mode_action && (
              <p className="mt-3 text-sm">
                <span className="font-semibold">Action recommandée :</span> {building.mode_action}
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <MapPin className="h-4 w-4" />
            Ouvrir dans Google Maps
          </a>

          <Link
            href="/buildings"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-base font-medium text-zinc-900 dark:text-white">
        {value ?? "—"}
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        highlight
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className={`text-xs font-medium uppercase tracking-widest ${highlight ? "text-white/70 dark:text-zinc-900/60" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${highlight ? "text-white dark:text-zinc-900" : "text-zinc-900 dark:text-white"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

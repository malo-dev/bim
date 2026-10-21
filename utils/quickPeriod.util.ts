// Filtres rapides par période (Aujourd'hui/Hier/Semaine/Mois), partagés
// entre les écrans Gestion (commandes, utilisateurs...). `.toISOString()`
// convertit en UTC avant de découper la date — avec un fuseau local en
// avance sur UTC, minuit local devient la veille en UTC et décale tous les
// filtres "un jour". On formate donc la date telle qu'affichée localement.
export type QuickPeriod = "today" | "yesterday" | "week" | "month" | null;

export const QUICK_PERIODS: { value: QuickPeriod; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function quickPeriodRange(period: QuickPeriod): { from: Date | null; to: Date | null } {
  const today = new Date();
  if (period === "today") {
    return { from: today, to: today };
  }
  if (period === "yesterday") {
    const y = new Date(today);
    y.setDate(y.getDate() - 1);
    return { from: y, to: y };
  }
  if (period === "week") {
    const start = new Date(today);
    const dow = (start.getDay() + 6) % 7; // lundi = 0
    start.setDate(start.getDate() - dow);
    return { from: start, to: today };
  }
  if (period === "month") {
    return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
  }
  return { from: null, to: null };
}

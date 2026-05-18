export const RESERVE_SAMPLE_STATUSES = [
  "Op voorraad",
  "Uitgeleend",
  "Beschadigd",
  "Vermist",
  "Retour leverancier",
] as const;

export type ReserveSampleStatus = (typeof RESERVE_SAMPLE_STATUSES)[number];

export function reserveSampleStatusBadgeClass(status: string): string {
  switch (status) {
    case "Op voorraad":
      return "bg-green-100 text-green-700";
    case "Uitgeleend":
      return "bg-amber-100 text-amber-800";
    case "Beschadigd":
      return "bg-orange-100 text-orange-700";
    case "Vermist":
      return "bg-red-100 text-red-700";
    case "Retour leverancier":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

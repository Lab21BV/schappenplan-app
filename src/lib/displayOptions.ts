export interface DisplayOption {
  value: string;
  label: string;
}

export interface CategoryLite {
  id: string;
  slug?: string;
  parentId: string | null;
}

function resolveSlug(cat: CategoryLite | undefined): string {
  return cat?.slug ?? cat?.id?.replace(/^cat-/, "") ?? "";
}

function isUnderRaamdecoratie(cat: CategoryLite, all: CategoryLite[] | undefined): boolean {
  let cur: CategoryLite | undefined = cat;
  const list = all ?? [];
  while (cur) {
    if (resolveSlug(cur) === "raamdecoratie") return true;
    if (!cur.parentId) return false;
    cur = list.find((c) => c.id === cur!.parentId);
  }
  return false;
}

export type LocatieType = "WAND" | "BOK" | "STROK";

export interface LocatieOption {
  value: string;
  label: string;
  type: LocatieType;
  nummer: number;
}

export const LOCATIE_OPTIONS: LocatieOption[] = [
  { value: "WAND-1", label: "Wand boven",    type: "WAND",  nummer: 1 },
  { value: "WAND-2", label: "Wand onder",    type: "WAND",  nummer: 2 },
  { value: "BOK-1",  label: "Bok 1",          type: "BOK",   nummer: 1 },
  { value: "BOK-2",  label: "Bok 2",          type: "BOK",   nummer: 2 },
  { value: "BOK-3",  label: "Bok 3",          type: "BOK",   nummer: 3 },
  { value: "BOK-4",  label: "Bok 4",          type: "BOK",   nummer: 4 },
  { value: "BOK-5",  label: "Bok 5",          type: "BOK",   nummer: 5 },
  { value: "BOK-6",  label: "Bok 6",          type: "BOK",   nummer: 6 },
  { value: "BOK-7",  label: "Bok 7",          type: "BOK",   nummer: 7 },
  { value: "BOK-8",  label: "Bok 8",          type: "BOK",   nummer: 8 },
  { value: "STROK-1", label: "Strook boven",  type: "STROK", nummer: 1 },
  { value: "STROK-2", label: "Strook midden", type: "STROK", nummer: 2 },
  { value: "STROK-3", label: "Strook onder",  type: "STROK", nummer: 3 },
];

export function encodeLocatie(type: string | null | undefined, nummer: number | null | undefined): string {
  if (!type || !nummer) return "";
  return `${type}-${nummer}`;
}

export function decodeLocatie(value: string): { type: LocatieType; nummer: number } | null {
  const opt = LOCATIE_OPTIONS.find((o) => o.value === value);
  return opt ? { type: opt.type, nummer: opt.nummer } : null;
}

export function labelForLocatie(type: string | null | undefined, nummer: number | null | undefined): string {
  if (!type) return "—";
  const opt = LOCATIE_OPTIONS.find((o) => o.type === type && o.nummer === nummer);
  return opt ? opt.label : `${type} ${nummer ?? ""}`.trim();
}

export const ARTICLE_STATUSES = ["Collectie", "Uitlopend", "Tijdelijk niet leverbaar"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export function statusBadgeClass(status: string): string {
  if (status === "Uitlopend") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (status === "Tijdelijk niet leverbaar") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-green-100 text-green-700 border border-green-200";
}

/**
 * Options for the "display afmeting" select on inventarisatie / schappenplan,
 * per category and per locatieType (WAND / BOK).
 */
export function getAfmetingOptions(
  cat: CategoryLite,
  allCats: CategoryLite[],
  locatieType: "WAND" | "BOK",
): DisplayOption[] {
  const slug = resolveSlug(cat);

  // Gordijnen — kapstaal vs showbaan
  if (slug === "gordijnen") {
    return [
      { value: "kapstaal", label: "Kapstaal" },
      { value: "showbaan", label: "Showbaan" },
    ];
  }

  // Reno trap HPL & PVC — traprenovatiedisplay vs staal 19×21
  if (slug === "reno-trap-hpl" || slug === "reno-trap-pvc") {
    return [
      { value: "traprenovatiedisplay", label: "Traprenovatiedisplay" },
      { value: "staal-19x21", label: "Staal 19×21 cm" },
    ];
  }

  // Raamdecoratie (harde raamdecoratie children) — sample i.p.v. strook / bord
  if (isUnderRaamdecoratie(cat, allCats)) {
    return [{ value: "sample", label: "Sample" }];
  }

  // Houten vloer — voeg "waaier" toe (t.b.v. Easyfit samplewaaier)
  if (slug === "houten-vloer") {
    if (locatieType === "WAND") {
      return [
        { value: "strook", label: "Strook" },
        { value: "100x60", label: "Bord 100×60" },
        { value: "waaier", label: "Waaier (Easyfit)" },
      ];
    }
    return [
      { value: "120x60", label: "Bord 120×60" },
      { value: "waaier", label: "Waaier (Easyfit)" },
    ];
  }

  // Default (vloer / laminaat / etc.)
  if (locatieType === "WAND") {
    return [
      { value: "strook", label: "Strook" },
      { value: "100x60", label: "Bord 100×60" },
    ];
  }
  return [{ value: "120x60", label: "Bord 120×60" }];
}

export function labelForAfmeting(value: string | null | undefined): string {
  if (!value) return "—";
  switch (value) {
    case "strook": return "Strook";
    case "100x60": return "Bord 100×60";
    case "120x60": return "Bord 120×60";
    case "sample": return "Sample";
    case "kapstaal": return "Kapstaal";
    case "showbaan": return "Showbaan";
    case "waaier": return "Waaier";
    case "staal-19x21": return "Staal 19×21 cm";
    case "traprenovatiedisplay": return "Traprenovatiedisplay";
    case "STROK": return "Strook";
    default: return value;
  }
}

export function defaultAfmeting(
  cat: CategoryLite,
  allCats: CategoryLite[],
  locatieType: "WAND" | "BOK",
): string {
  const opts = getAfmetingOptions(cat, allCats, locatieType);
  return opts[0]?.value ?? "";
}

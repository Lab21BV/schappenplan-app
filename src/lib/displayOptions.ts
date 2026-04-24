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

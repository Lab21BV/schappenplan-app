import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  Store,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Grid3X3,
  ClipboardList,
  LayoutTemplate,
  Package,
  BarChart2,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Direction = "hq-to-showroom" | "showroom-to-hq" | "two-way" | "hq-only";

interface Module {
  icon: LucideIcon;
  name: string;
  direction: Direction;
  hqRole: string;
  showroomRole: string;
  flow: string[];
}

const MODULES: Module[] = [
  {
    icon: Package,
    name: "Artikelen",
    direction: "hq-only",
    hqRole:
      "Beheert alle artikelen centraal: artikelnummer, naam, leverancier, categorie, prijzen, prio, status (Collectie / Uitlopend / Tijdelijk niet leverbaar). Importeert via CSV/Excel.",
    showroomRole:
      "Heeft geen toegang tot artikelbeheer. Ziet artikelnamen en -nummers wel als referentie in Schappenplan, Inventarisatie en Showvloer.",
    flow: [
      "HQ importeert / wijzigt artikelen in Artikelenbeheer",
      "Wijzigingen werken direct door in Schappenplan, Inventarisatie en Showvloer van álle showrooms",
      "Status (zoals Uitlopend) wordt zichtbaar in elke showroom",
    ],
  },
  {
    icon: Settings,
    name: "Beheer (Display-config)",
    direction: "hq-to-showroom",
    hqRole:
      "Stelt per showroom + categorie het aantal stroken, wandborden en bokken in. Bepaalt het 'frame' waarbinnen de showroom zijn schappenplan ziet.",
    showroomRole:
      "Werkt automatisch binnen de door HQ ingestelde aantallen. Geen direct beheer.",
    flow: [
      "HQ kiest een showroom in Beheer",
      "HQ stelt per categorie de aantallen stroken/bokken/wandborden in",
      "Schappenplan-pagina van die showroom past zich direct aan",
    ],
  },
  {
    icon: Grid3X3,
    name: "Schappenplan",
    direction: "hq-to-showroom",
    hqRole:
      "Maakt het centrale planogram per showroom: welk artikel op welke locatie (Wand / Bok / Strook), positie en displayafmeting. Importeert per showroom via CSV/Excel of vult standaard in.",
    showroomRole:
      "Bekijkt het schappenplan van eigen showroom. Kan niet wijzigen. Gebruikt het als referentie tijdens de inventarisatie.",
    flow: [
      "HQ kiest showroom + importeert/bewerkt schappenplan",
      "Schappenplan verschijnt direct in de showroom-omgeving",
      "Showroom checkt fysiek de winkel tegen het plan via Inventarisatie",
    ],
  },
  {
    icon: ClipboardList,
    name: "Inventarisatie",
    direction: "showroom-to-hq",
    hqRole:
      "Ziet per showroom welke artikelen wél aanwezig zijn, welke ontbreken (in plan maar niet geteld) en welke extra zijn (geteld maar niet in plan). Aggregeert dit in HQ Overzicht en Verschil-export.",
    showroomRole:
      "Telt fysiek de winkel: vult per locatie aantal in. Voegt notities toe. Bevestigt het plan of meldt afwijkingen.",
    flow: [
      "Showroom doorloopt het schappenplan en telt voorraad per locatie",
      "Status (Aanwezig / Ontbreekt / Extra) wordt automatisch berekend",
      "HQ ziet verschilrapport per showroom én totaal in HQ Overzicht → Verschil",
    ],
  },
  {
    icon: LayoutTemplate,
    name: "Showvloer",
    direction: "showroom-to-hq",
    hqRole:
      "Bekijkt per showroom welke vloerartikelen daadwerkelijk getoond worden. Ziet status 'aanwezig, beschadigd' of 'niet aanwezig' als signaal.",
    showroomRole:
      "Registreert welke vloerartikelen op de showvloer liggen, met genummerde positie. Markeert beschadiging.",
    flow: [
      "Showroom voegt vloerartikelen toe via + Artikel toevoegen",
      "Showroom kiest artikel + nummer + status",
      "HQ ziet showvloer-overzicht en verschil per showroom in HQ Overzicht",
    ],
  },
  {
    icon: BarChart2,
    name: "HQ Overzicht",
    direction: "hq-only",
    hqRole:
      "Aggregeert alle data van alle showrooms: aantal planogrampunten, geïnventariseerde regels, ontbrekend/extra. Per showroom of totaal. Export naar Excel/CSV per leverancier.",
    showroomRole:
      "Geen toegang.",
    flow: [
      "Data uit Schappenplan + Inventarisatie + Showvloer wordt samengebracht",
      "HQ filtert op showroom of bekijkt totaal",
      "Verschil-export geeft per leverancier een tabblad",
    ],
  },
];

const ROLE_LABELS = {
  "hq-only": { label: "HQ-only", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Building2 },
  "hq-to-showroom": { label: "HQ → Showroom", color: "bg-blue-100 text-blue-700 border-blue-200", icon: ArrowRight },
  "showroom-to-hq": { label: "Showroom → HQ", color: "bg-green-100 text-green-700 border-green-200", icon: ArrowLeft },
  "two-way": { label: "Beide kanten", color: "bg-amber-100 text-amber-700 border-amber-200", icon: ArrowLeftRight },
} as const;

export default async function WerkingPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Werking & interactie</h1>
        <p className="text-gray-500 text-sm mt-1">
          Hoe data en handelingen tussen showrooms en hoofdkantoor stromen — per module
        </p>
      </div>

      <FlowDiagram />

      <div className="space-y-4">
        {MODULES.map((m) => (
          <ModuleCard key={m.name} module={m} />
        ))}
      </div>

      <Legend />
    </div>
  );
}

function FlowDiagram() {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Datastroom in één blik</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <RoleBox icon={Building2} title="Hoofdkantoor" subtitle="Centraal beheer" tone="purple">
          <li>Artikelen master</li>
          <li>Schappenplan per showroom</li>
          <li>Display-config</li>
          <li>Aggregatie & rapportage</li>
        </RoleBox>

        <div className="flex flex-col gap-3 items-center text-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-blue-700 text-xs font-medium border border-blue-200">
            <ArrowRight className="w-3.5 h-3.5" />
            Plan / Artikelen / Config
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-green-700 text-xs font-medium border border-green-200">
            <ArrowLeft className="w-3.5 h-3.5" />
            Telling / Showvloer
          </div>
        </div>

        <RoleBox icon={Store} title="Showroom" subtitle="Operationeel" tone="green">
          <li>Schappenplan inzien</li>
          <li>Inventarisatie tellen</li>
          <li>Showvloer registreren</li>
          <li>Notities terugkoppelen</li>
        </RoleBox>
      </div>
    </section>
  );
}

function RoleBox({
  icon: Icon,
  title,
  subtitle,
  tone,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone: "purple" | "green";
  children: React.ReactNode;
}) {
  const palette =
    tone === "purple"
      ? "bg-purple-50 border-purple-200 text-purple-900"
      : "bg-green-50 border-green-200 text-green-900";
  const iconBg = tone === "purple" ? "bg-purple-200 text-purple-800" : "bg-green-200 text-green-800";
  return (
    <div className={`rounded-xl border p-4 ${palette}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">{title}</p>
          <p className="text-xs opacity-70">{subtitle}</p>
        </div>
      </div>
      <ul className="text-xs space-y-1 pl-4 list-disc opacity-90">{children}</ul>
    </div>
  );
}

function ModuleCard({ module: m }: { module: Module }) {
  const Icon = m.icon;
  const role = ROLE_LABELS[m.direction];
  const RoleIcon = role.icon;

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-gray-900">{m.name}</h3>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${role.color}`}>
          <RoleIcon className="w-3.5 h-3.5" />
          {role.label}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-purple-700 uppercase tracking-wide">
            <Building2 className="w-3.5 h-3.5" />
            Hoofdkantoor
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{m.hqRole}</p>
        </div>
        <div className="p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-green-700 uppercase tracking-wide">
            <Store className="w-3.5 h-3.5" />
            Showroom
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{m.showroomRole}</p>
        </div>
      </div>

      <div className="px-5 py-4 bg-blue-50/40 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Flow</p>
        <ol className="space-y-1.5">
          {m.flow.map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Legend() {
  return (
    <section className="bg-gray-50 rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Legenda</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).map(([key, val]) => {
          const RoleIcon = val.icon;
          return (
            <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${val.color}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {val.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}

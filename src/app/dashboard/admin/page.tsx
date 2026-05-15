import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getShowrooms, getCategories } from "@/lib/dataCache";
import AdminManager from "@/components/AdminManager";
import PageHelp, { HelpList, HelpNote, HelpSection } from "@/components/PageHelp";

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard");

  const [showrooms, categories, displayConfigs] = await Promise.all([
    getShowrooms(),
    getCategories(),
    prisma.displayConfig.findMany({ include: { category: true, showroom: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Beheer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configureer displays per showroom en categorie
        </p>
      </div>
      <PageHelp title="Toelichting Beheer — display- en showroom-configuratie">
        <HelpSection title="Wat configureer je hier?">
          <p>
            Per <strong>showroom × categorie</strong> de mogelijke display-typen (bord
            of strook) en afmetingen die in het schappenplan en de inventaris
            gekozen kunnen worden.
          </p>
        </HelpSection>
        <HelpSection title="Waarvoor wordt het gebruikt?">
          <HelpList>
            <li><strong>Schappenplan-import</strong>: valideert dat de display-afmeting bij de showroom/categorie hoort.</li>
            <li><strong>Inventarisatie</strong>: de dropdown-keuzes bij &quot;Nieuwe inventarisatie&quot; komen uit deze configuratie.</li>
            <li>Gebruikersbeheer (wachtwoorden, showroomkoppeling) gebeurt in dezelfde sectie.</li>
          </HelpList>
        </HelpSection>
        <HelpNote>
          Verwijder geen showroom of gebruiker met actieve gegevens — gekoppelde
          inventaris- en uitleenregels worden dan niet meer correct getoond.
        </HelpNote>
      </PageHelp>

      <AdminManager
        showrooms={showrooms}
        categories={categories}
        displayConfigs={displayConfigs as any}
      />
    </div>
  );
}

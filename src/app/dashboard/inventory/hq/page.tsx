import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReserveSamplesManager from "@/components/ReserveSamplesManager";
import PageHelp, { HelpList, HelpSection } from "@/components/PageHelp";

export default async function HQReserveStalenPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
  if (user.role !== "HOOFDKANTOOR") redirect("/dashboard/inventory");

  const samples = await prisma.reserveSample.findMany({
    orderBy: [{ articleName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reserve stalen Amersfoort</h1>
        <p className="text-gray-500 text-sm mt-1">
          Centrale voorraad reserve stalen op het HQ
        </p>
      </div>

      <PageHelp title="Toelichting Reserve stalen — beheer & import">
        <HelpSection title="Wat is dit?">
          <p>
            Lijst van reserve stalen die op het hoofdkantoor in Amersfoort liggen.
            Bedoeld om bij te houden welke stalen beschikbaar zijn als vervanging voor
            showrooms.
          </p>
        </HelpSection>
        <HelpSection title="Wat kun je hier?">
          <HelpList>
            <li><strong>Status aanpassen</strong> — bv. <em>Uitgeleend</em>, <em>Beschadigd</em>, <em>Vermist</em>.</li>
            <li><strong>Aantal bijwerken</strong> wanneer er stalen worden toegevoegd of weggehaald.</li>
            <li><strong>Regel verwijderen</strong> als een staal niet meer in voorraad is.</li>
            <li><strong>Excel-import</strong> om in één keer een hele lijst toe te voegen.</li>
          </HelpList>
        </HelpSection>
      </PageHelp>

      <ReserveSamplesManager initial={samples} />
    </div>
  );
}

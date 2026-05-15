import { auth } from "@/lib/auth";

export default async function HandleidingPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as typeof session.user & { role: string };
  const isHQ = user.role === "HOOFDKANTOOR";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Handleiding</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isHQ ? "Hoofdkantoor — volledig overzicht van alle functies" : "Showroom medewerker — uitleg van alle functies"}
        </p>
      </div>

      {isHQ ? <HQHandleiding /> : <VerkoperHandleiding />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
        <h2 className="text-base font-semibold text-blue-900">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-3 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p>{children}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs">
      <strong>Let op:</strong> {children}
    </div>
  );
}

function VerkoperHandleiding() {
  return (
    <div className="space-y-6">
      <Section title="Inloggen">
        <Step n={1}>Ga naar de applicatie en log in met je persoonlijke accountgegevens.</Step>
        <Step n={2}>Klik op <em>Inloggen</em>. Je wordt automatisch doorgestuurd naar je eigen showroom-dashboard.</Step>
        <Note>Je hebt alleen toegang tot de gegevens van jouw eigen showroom.</Note>
      </Section>

      <Section title="Schappenplan bekijken">
        <p>Het schappenplan toont welke artikelen op welke locatie in de showroom horen te staan.</p>
        <Step n={1}>Klik in het linkermenu op <strong>Schappenplan</strong>.</Step>
        <Step n={2}>De pagina toont per categorie (bijv. Raamdecoratie, Vloer) een overzicht van alle locaties.</Step>
        <Step n={3}>Elke locatie geeft aan: het artikelnummer, de artikelnaam, het display-type (bord of strook) en de afmeting.</Step>
        <Note>Het schappenplan kan alleen worden gewijzigd door het Hoofdkantoor. Als je een fout ziet, neem dan contact op met HQ.</Note>
      </Section>

      <Section title="Inventarisatie invoeren">
        <p>De inventarisatie registreert wat er daadwerkelijk aanwezig is op de showroomvloer, zodat het verschil met het schappenplan zichtbaar wordt.</p>
        <Step n={1}>Klik in het linkermenu op <strong>Inventarisatie</strong>.</Step>
        <Step n={2}>De pagina toont per locatie het verwachte artikel (uit het schappenplan) en een invoerveld voor de werkelijke voorraad.</Step>
        <Step n={3}>Vul per artikel het aantal in dat aanwezig is. Gebruik <strong>0</strong> als een artikel er niet is.</Step>
        <Step n={4}>Klik op <em>Opslaan</em> om de invoer te bewaren.</Step>
        <Step n={5}>De status wordt automatisch berekend: <strong className="text-green-700">Aanwezig</strong>, <strong className="text-red-700">Ontbreekt</strong> of <strong className="text-orange-600">Extra</strong>.</Step>
        <Note>Vul de inventarisatie zo volledig mogelijk in. Het Hoofdkantoor gebruikt deze gegevens voor rapportages.</Note>
      </Section>

      <Section title="Showvloer beheren">
        <p>De showvloer registreert welke vloerartikelen daadwerkelijk tentoongesteld zijn in de showroom.</p>
        <Step n={1}>Klik in het linkermenu op <strong>Showvloer</strong>.</Step>
        <Step n={2}>Je ziet een overzicht van alle tentoongestelde vloerartikelen, genummerd per positie.</Step>
        <Step n={3}>Klik op <em>+ Artikel toevoegen</em> om een nieuw vloerstuk toe te voegen. Kies het artikel uit de lijst en wijs een nummer toe.</Step>
        <Step n={4}>Om een artikel te verwijderen, klik je op het prullenbak-icoontje naast het artikel.</Step>
        <Note>Alleen artikelen uit de categorie <em>Vloer</em> zijn beschikbaar voor de showvloer.</Note>
      </Section>

      <Section title="Uitleningen registreren">
        <p>Wanneer een klant een staal (bord, strook, sample) meeneemt, registreer je dat hier zodat je weet wie wat heeft en wanneer het terug moet.</p>
        <Step n={1}>Klik in het linkermenu op <strong>Uitleningen</strong>.</Step>
        <Step n={2}>Klik rechtsboven op <em>+ Nieuwe uitlening</em>.</Step>
        <Step n={3}>
          (Optioneel) Kies bij <strong>Inventaris-item</strong> de specifieke locatie waar het staal vandaan komt
          — dan verschijnt op de inventarisatie-pagina automatisch de status <strong className="text-amber-700">Uitgeleend</strong> bij die rij.
        </Step>
        <Step n={4}>Vul de <strong>omschrijving van het staal</strong> in (bijv. &quot;Bord 120x60 Sensation Oak Grey&quot;).</Step>
        <Step n={5}>Vul de klantgegevens in: naam (verplicht), e-mail, telefoon, adres.</Step>
        <Step n={6}>Stel <strong>Geleend op</strong> en <strong>Toegezegd terug</strong> in (default: vandaag + 14 dagen).</Step>
        <Step n={7}>Klik op <em>Uitlening registreren</em>. De uitlening verschijnt in het tabblad <strong>Open</strong>.</Step>
        <Note>Tabbladen <strong>Open</strong>, <strong className="text-red-700">Te laat</strong> en <strong className="text-green-700">Teruggebracht</strong> tonen het aantal in een badge. Te-late uitleningen springen rood eruit met het aantal dagen overschrijding.</Note>
      </Section>

      <Section title="Uitlening afmelden (teruggebracht)">
        <Step n={1}>Ga naar <strong>Uitleningen</strong>.</Step>
        <Step n={2}>Vind de uitlening in het tabblad <strong>Open</strong> of <strong>Te laat</strong>.</Step>
        <Step n={3}>Klik op de groene knop <strong>✓ Terug</strong> aan het einde van de rij — de uitlening verhuist direct naar het tabblad <strong>Teruggebracht</strong>.</Step>
        <Step n={4}>Optioneel: klik op de omschrijving om naar de detailpagina te gaan; daar kun je ook <em>Markeer als teruggebracht</em> klikken, gegevens bewerken of de uitlening verwijderen.</Step>
        <Note>Per ongeluk afgemeld? Open de detailpagina van die uitlening en klik op <em>↺ Maak retour ongedaan</em>.</Note>
      </Section>

      <Section title="Uitloggen">
        <Step n={1}>Klik rechtsboven op je naam of het gebruikersicoontje.</Step>
        <Step n={2}>Kies <em>Uitloggen</em>. Je wordt teruggestuurd naar de inlogpagina.</Step>
      </Section>
    </div>
  );
}

function HQHandleiding() {
  return (
    <div className="space-y-6">
      <Section title="Inloggen als Hoofdkantoor">
        <Step n={1}>Log in met je persoonlijke hoofdkantoor-account.</Step>
        <Step n={2}>Na inloggen heb je toegang tot alle showrooms en extra functies zoals HQ Overzicht, Artikelenbeheer en Beheer.</Step>
      </Section>

      <Section title="Showroom wisselen (Schappenplan / Inventarisatie / Showvloer)">
        <p>Als HQ-gebruiker kun je de gegevens van elke showroom afzonderlijk bekijken.</p>
        <Step n={1}>Ga naar <strong>Schappenplan</strong>, <strong>Inventarisatie</strong> of <strong>Showvloer</strong> via het linkermenu.</Step>
        <Step n={2}>Boven de inhoud verschijnen pills met alle showroomnamen. Klik op een showroom om naar die showroom te wisselen.</Step>
        <Step n={3}>De pagina herlaadt automatisch met de gegevens van de geselecteerde showroom.</Step>
      </Section>

      <Section title="Schappenplan importeren">
        <p>Het standaard schappenplan per showroom kan worden ingeladen via een CSV- of Excel-bestand.</p>
        <Step n={1}>Ga naar <strong>Schappenplan</strong> en klik rechtsboven op <em>Importeer</em>.</Step>
        <Step n={2}>Selecteer de doelshowroom via de showroom-selector in het importvenster.</Step>
        <Step n={3}>
          Download eerst het <em>Template</em> als je het formaat wilt zien. Het bestand heeft de kolommen:{" "}
          <code className="bg-gray-100 px-1 rounded">locatieType; locatieNummer; positie; artikelnummer; displayAfmeting</code>.
        </Step>
        <Step n={4}>Kies je CSV- of Excel-bestand en klik op <em>Importeer</em>. Bestaande planogramdata voor die showroom wordt vervangen.</Step>
        <Note>Het importeren overschrijft het bestaande schappenplan van de geselecteerde showroom volledig. Maak eerst een export als back-up.</Note>
      </Section>

      <Section title="Schappenplan exporteren">
        <Step n={1}>Ga naar <strong>Schappenplan</strong> en selecteer de gewenste showroom.</Step>
        <Step n={2}>Klik rechtsboven op <em>Exporteer</em>. Er wordt een CSV-bestand gedownload met het volledige schappenplan van die showroom.</Step>
      </Section>

      <Section title="Standaard schappenplan invullen">
        <p>Via het formulier kun je handmatig een standaard schappenplan instellen voor een showroom.</p>
        <Step n={1}>Klik op <strong>Schappenplan</strong> en dan op <em>+ Standaard invullen</em> rechtsboven.</Step>
        <Step n={2}>Selecteer de showroom waarvoor je het plan wilt invullen.</Step>
        <Step n={3}>Vul per locatie het artikel in door een artikelnummer of naam te zoeken en de positie/afmeting te kiezen.</Step>
        <Step n={4}>Klik op <em>Opslaan</em> om het schappenplan op te slaan.</Step>
      </Section>

      <Section title="HQ Overzicht — statistieken per showroom">
        <Step n={1}>Klik in het linkermenu op <strong>HQ Overzicht</strong>.</Step>
        <Step n={2}>
          De standaardweergave toont een tabel met alle showrooms: aantal planogrampunten, aantal geïnventariseerde artikelen, en het verschil (ontbrekend / extra).
        </Step>
        <Step n={3}>
          Gebruik de navigatiepills bovenaan om te wisselen tussen weergaven:
        </Step>
        <ul className="ml-9 list-disc space-y-1">
          <li><strong>Overzicht</strong> — samenvattingstabel per showroom + uitsplitsing per leverancier.</li>
          <li><strong>Schappenplan</strong> — het volledige schappenplan van een geselecteerde showroom.</li>
          <li><strong>Inventarisatie</strong> — de inventarisatiestatus van een geselecteerde showroom.</li>
          <li><strong>Verschil</strong> — alle ontbrekende en extra artikelen per showroom en totaal.</li>
          <li><strong>Uitleningen</strong> — open en te-late uitleningen per showroom + complete cross-showroom lijst van te-late stalen met klantgegevens.</li>
        </ul>
      </Section>

      <Section title="Uitleningen — overzicht en opvolging">
        <p>Elke showroom kan stalen uitlenen aan klanten. Als HQ zie je in één blik welke uitleningen open staan en welke over de toegezegde retourdatum zijn.</p>
        <Step n={1}>
          Snel overzicht: <strong>HQ Overzicht → tab Uitleningen</strong>. Daar zie je per showroom hoeveel uitleningen open staan en hoeveel te laat zijn, plus een tabel met alle te-late stalen (klant, verkoper, dagen te laat).
        </Step>
        <Step n={2}>
          Detail per showroom: klik in het linkermenu op <strong>Uitleningen</strong>. Bovenaan staat een showroom-selector — klik een showroom om die te bekijken.
        </Step>
        <Step n={3}>
          Klik op de omschrijving van een uitlening om de detailpagina te openen met klantgegevens, datums, gekoppelde inventaris-item en knoppen om te markeren als teruggebracht of te verwijderen.
        </Step>
        <Note>Op de inventarisatie-pagina zie je een amber <strong className="text-amber-700">Uitgeleend →</strong> badge bij elk inventaris-item dat aan een open uitlening gekoppeld is. Klik erop om naar de uitlening te springen.</Note>
      </Section>

      <Section title="Verschil exporteren (CSV / Excel)">
        <p>Exporteer een matrix met per artikel en locatie welke showrooms een afwijking hebben.</p>
        <Step n={1}>Ga naar <strong>HQ Overzicht</strong> en klik bovenaan op <em>Verschil</em>.</Step>
        <Step n={2}>Klik op <em>↓ Excel</em> voor een Excel-bestand met één tabblad per leverancier, of op <em>↓ CSV</em> voor een plat tekstbestand.</Step>
        <Step n={3}>Het bestand bevat kolommen: Leverancier, Artikelnummer, Artikelnaam, Locatie Type, Locatie Nr., Display Type, Afmeting, en daarna één kolom per showroom.</Step>
        <Step n={4}>In elke showroomkolom staat <strong>Ontbreekt</strong>, <strong>Extra</strong> of een lege cel als er geen afwijking is.</Step>
      </Section>

      <Section title="Artikelenbeheer">
        <Step n={1}>Klik in het linkermenu op <strong>Artikelen</strong>.</Step>
        <Step n={2}>Hier kun je artikelen toevoegen, bewerken of deactiveren. Een gedeactiveerd artikel verschijnt niet meer in importlijsten of keuzemenu&apos;s.</Step>
        <Step n={3}>Elk artikel heeft: artikelnummer, naam, leverancier, categorie en status (actief/inactief).</Step>
      </Section>

      <Section title="Gebruikersbeheer (Beheer)">
        <Step n={1}>Klik in het linkermenu op <strong>Beheer</strong>.</Step>
        <Step n={2}>Hier zie je een overzicht van alle gebruikers (verkopers en HQ-accounts).</Step>
        <Step n={3}>Je kunt nieuwe gebruikers aanmaken, de showroomkoppeling wijzigen of een wachtwoord resetten.</Step>
        <Note>Verwijder geen gebruiker als die nog actieve inventarisatiegegevens heeft — die gegevens zijn dan niet meer terug te vinden.</Note>
      </Section>

      <Section title="Toegang en beveiliging">
        <p>Gebruik altijd persoonlijke accounts en deel geen inloggegevens via e-mail, chat of documenten.</p>
        <p>Neem bij toegangsvragen of accountwijzigingen contact op met de applicatiebeheerder.</p>
      </Section>
    </div>
  );
}

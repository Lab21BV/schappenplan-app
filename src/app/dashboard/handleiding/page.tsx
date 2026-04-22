import { auth } from "@/lib/auth";

export default async function HandleidingPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user as any;
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
        <Step n={1}>Ga naar de applicatie en vul je e-mailadres in, bijvoorbeeld <strong>amersfoort@lab21.nl</strong>.</Step>
        <Step n={2}>Vul het wachtwoord in: <strong>Lab21</strong>.</Step>
        <Step n={3}>Klik op <em>Inloggen</em>. Je wordt automatisch doorgestuurd naar je eigen showroom-dashboard.</Step>
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
        <Step n={1}>Ga naar de applicatie en vul in: <strong>hq@lab21.nl</strong>.</Step>
        <Step n={2}>Wachtwoord: <strong>Lab21</strong>.</Step>
        <Step n={3}>Na inloggen heb je toegang tot alle showrooms en extra functies zoals HQ Overzicht, Artikelenbeheer en Beheer.</Step>
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
        </ul>
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
        <Step n={2}>Hier kun je artikelen toevoegen, bewerken of deactiveren. Een gedeactiveerd artikel verschijnt niet meer in importlijsten of keuzemenu's.</Step>
        <Step n={3}>Elk artikel heeft: artikelnummer, naam, leverancier, categorie en status (actief/inactief).</Step>
      </Section>

      <Section title="Gebruikersbeheer (Beheer)">
        <Step n={1}>Klik in het linkermenu op <strong>Beheer</strong>.</Step>
        <Step n={2}>Hier zie je een overzicht van alle gebruikers (verkopers en HQ-accounts).</Step>
        <Step n={3}>Je kunt nieuwe gebruikers aanmaken, de showroomkoppeling wijzigen of een wachtwoord resetten.</Step>
        <Note>Verwijder geen gebruiker als die nog actieve inventarisatiegegevens heeft — die gegevens zijn dan niet meer terug te vinden.</Note>
      </Section>

      <Section title="Logins per showroom (overzicht)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Showroom</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold">E-mailadres</th>
                <th className="text-left px-3 py-2 border border-gray-200 font-semibold">Wachtwoord</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Hoofdkantoor", "hq@lab21.nl"],
                ["Amersfoort", "amersfoort@lab21.nl"],
                ["Amsterdam", "amsterdam@lab21.nl"],
                ["Breda", "breda@lab21.nl"],
                ["Capelle", "capelle@lab21.nl"],
                ["Delft", "delft@lab21.nl"],
                ["Den Bosch", "denbosch@lab21.nl"],
                ["Eindhoven", "eindhoven@lab21.nl"],
                ["Enschede", "enschede@lab21.nl"],
                ["Groningen", "groningen@lab21.nl"],
                ["Leeuwarden", "leeuwarden@lab21.nl"],
                ["Leiden", "leiden@lab21.nl"],
                ["Oostzaan", "oostzaan@lab21.nl"],
                ["Tilburg", "tilburg@lab21.nl"],
                ["Utrecht", "utrecht@lab21.nl"],
                ["Veenendaal", "veenendaal@lab21.nl"],
              ].map(([showroom, email]) => (
                <tr key={email} className="even:bg-gray-50">
                  <td className="px-3 py-1.5 border border-gray-200">{showroom}</td>
                  <td className="px-3 py-1.5 border border-gray-200 font-mono">{email}</td>
                  <td className="px-3 py-1.5 border border-gray-200">Lab21</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

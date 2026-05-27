/**
 * Drupal Content Extraction Helper
 *
 * This script provides utilities for extracting content from the ru.nl Drupal CMS.
 *
 * IMPORTANT: This is for READ-ONLY extraction. Never modify content on the live site.
 *
 * Drupal CMS Structure (discovered 2026-01-11):
 * - Content Type: "Service"
 * - Tab 1 (Inhoud): Naam, Samenvatting (250 chars), Beschrijving (CKEditor), Paragraphs
 * - Tab 2 (Extra informatie): Rubriek (3-level taxonomy), Doelgroep, Ook interessant
 * - Tab 3 (Contact informatie): Email, Phone, Department
 *
 * Rubriek Taxonomy (ICT categories):
 * - Level 1: Campusfaciliteiten & gebouwen
 * - Level 2: ICT
 * - Level 3: Wachtwoord, Wifi, Buiten de campus werken, Bestanden delen en samenwerken,
 *            Printen kopiëren en scannen, E-mail en agenda, Beveiliging, Software, Hardware
 */

// Known ICT page node IDs (collected from ru.nl edit URLs)
// Format: 'url-slug': nodeId
const ICT_NODE_IDS = {
  // Wachtwoord category
  'veilig-wachtwoord-instellen': 53060,

  // Buiten de campus werken category
  'buiten-de-campus-toegang-tot-bestanden': 1649,

  // Add more as you discover them by visiting pages and clicking "Bewerken"
};

// Complete ICT structure extracted from ru.nl (2026-01-11)
// All 9 categories with 53 total pages
const ICT_STRUCTURE = {
  categories: [
    {
      id: 'cat-wachtwoord',
      label: 'Wachtwoord',
      url: '/services/campusfaciliteiten-gebouwen/ict/wachtwoord',
      pages: [
        { title: 'Veilig wachtwoord instellen', url: '/services/campusfaciliteiten-gebouwen/ict/wachtwoord/veilig-wachtwoord-instellen', description: 'Het is belangrijk om een goed wachtwoord in te stellen. Zo verhoog je je eigen digitale veiligheid en de veiligheid van de Radboud Universiteit.' },
        { title: 'Wachtwoord geblokkeerd', url: '/services/campusvoorzieningen/werk-en-studie-ondersteunende-diensten/ict/wachtwoord/wachtwoord-geblokkeerd', description: 'Als je te laat je wachtwoord wijzigt of deze te vaak verkeerd invoert wordt je account geblokkeerd. Je kunt je wachtwoord dan heractiveren.' },
        { title: 'Wachtwoord vergeten', url: '/services/campusfaciliteiten-gebouwen/ict/wachtwoord/wachtwoord-vergeten', description: 'Wachtwoord vergeten? Vraag een nieuw wachtwoord aan via het ICT Servicepunt, de ICT Helpdesk, je leidinggevende of secretariaat.' },
        { title: 'Wachtwoord wijzigen', url: '/services/campusfaciliteiten-gebouwen/ict/wachtwoord/wachtwoord-wijzigen', description: 'Eén keer per jaar moet je je wachtwoord voor je accounts van de Radboud Universiteit wijzigen.' }
      ]
    },
    {
      id: 'cat-wifi',
      label: 'Wifi',
      url: '/services/campusfaciliteiten-gebouwen/ict/wifi',
      pages: [
        { title: 'Eduroam (wifi) werkt niet', url: '/services/campusfaciliteiten-gebouwen/ict/wifi/eduroam-wifi-werkt-niet', description: 'Kijk wat je kunt doen als je niet kunt verbinden met wifi op de campus.' },
        { title: 'Wifi (eduroam) instellen', url: '/services/campusfaciliteiten-gebouwen/ict/wifi/wifi-eduroam-instellen', description: "Om toegang te krijgen tot wifi op de campus, stel je eenmalig het wifi-netwerk 'eduroam' in op je apparaat." },
        { title: 'Wifi voor gasten', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/wifi/wifi-voor-gasten', description: 'Met eduroam Visitor Access (eVA) kunnen medewerkers hun gasten toegang geven tot het eduroamnetwerk (wifi) op de campus.' }
      ]
    },
    {
      id: 'cat-buiten-de-campus-werken',
      label: 'Buiten de campus werken',
      url: '/services/campusfaciliteiten-gebouwen/ict/buiten-de-campus-werken',
      pages: [
        { title: 'Buiten de campus toegang tot bestanden', url: '/services/campusfaciliteiten-gebouwen/ict/buiten-de-campus-werken/buiten-de-campus-toegang-tot-bestanden', description: 'Wil je buiten de campus toegang hebben tot je bestanden? Download het programma RU-Connect.' },
        { title: 'Problemen met eduVPN', url: '/services/campusfaciliteiten-gebouwen/ict/buiten-de-campus-werken/problemen-met-eduvpn', description: 'Lees wat je kunt doen als eduVPN geen verbinding maakt.' },
        { title: 'Radboud-werkplek overnemen', url: '/medewerkers/services/campusvoorzieningen/werk-en-studie-ondersteunende-diensten/ict/buiten-de-campus-werken/radboud-werkplek-overnemen', description: 'Lees hier hoe je je jouw Radboud-werkplek overneemt als je werkt vanaf een andere locatie.' },
        { title: 'Teams', url: '/services/campusfaciliteiten-gebouwen/ict/software/teams', description: 'Microsoft Teams is een online samenwerkingstool. Met deze applicatie kun je met mensen binnen en buiten de Radboud Universiteit chatten, (video)bellen, online vergaderen, taken en planningen beheren en real-time samenwerken in documenten.' },
        { title: 'VPN: buiten de campus toegang tot systemen', url: '/services/campusfaciliteiten-gebouwen/ict/buiten-de-campus-werken/vpn-buiten-de-campus-toegang-tot-systemen', description: 'VPN is een manier om veilig gebruik te maken van internet, vooral als je vanaf een openbare internetverbinding werkt. Ook heb je toegang tot alle systemen van de universiteit.' }
      ]
    },
    {
      id: 'cat-bestanden-delen-en-samenwerken',
      label: 'Bestanden delen en samenwerken',
      url: '/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken',
      pages: [
        { title: 'Bestanden veilig delen en opslaan', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/bestanden-veilig-delen-en-opslaan', description: 'Wil je weten hoe je veilig bestanden kunt delen en opslaan? Bepaal met welk soort informatie je te maken hebt en kies zo de juiste opslaglocatie.' },
        { title: 'Bestanden versleuteld versturen met Filesender', url: '/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/bestanden-versleuteld-versturen-met-filesender', description: 'Met SURFfilesender kun je grote bestanden veilig versturen, zonder extra software of plug-ins. Je kunt grote bestanden versturen met SURFfilesender (tot 1 TB).' },
        { title: 'Hulp bij informatiebeheer', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/hulp-bij-informatiebeheer', description: 'De afdeling Documentaire Informatie Voorziening (DIV) van de Radboud Universiteit helpt bij het effectief en efficiënt beheren en ontsluiten van je informatie.' },
        { title: 'SURFdrive', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/surfdrive', description: 'SURFdrive is een persoonlijke opslagdienst in de cloud. Je kunt documenten opslaan, synchroniseren en delen met anderen in een beveiligde omgeving.' },
        { title: 'Toegang werkgroepmappen beheren', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/toegang-werkgroepmappen-beheren', description: 'De eigenaar van de werkgroepmap kan mensen aan werkgroepmappen toevoegen of verwijderen in de Accountportal.' },
        { title: 'Werkgroepmap aanvragen', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/werkgroepmap-aanvragen', description: 'Als je met een team documenten wilt delen, kun je een werkgroepmap aanvragen in de Accountportal.' },
        { title: 'Werkgroepmappen gebruiken', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/werkgroepmappen-gebruiken', description: 'Via je beheerde Windows Radboud computer heb je toegang tot werkgroepmappen via \'Snelle toegang\'.' }
      ]
    },
    {
      id: 'cat-printen-kopieren-en-scannen',
      label: 'Printen, kopiëren en scannen',
      url: '/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen',
      pages: [
        { title: 'Betaalapp KUARIO', url: '/studenten/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/betaalapp-kuario', description: 'Studenten moeten saldo hebben om te kunnen printen, kopiëren en scannen. Hiervoor maak je gebruik van de app KUARIO.' },
        { title: 'In- en uitloggen printer', url: '/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/in-en-uitloggen-printer', description: 'Om de printers op de campus te gebruiken moet je inloggen en na gebruik weer uitloggen. Inloggen kan op verschillende manieren.' },
        { title: 'Kopiëren', url: '/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/kopieren', description: 'De multifunctionele printers bieden ook kopieerfunctionaliteit. Hiermee kun je documenten of andere materialen kopiëren.' },
        { title: 'Printen', url: '/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/printen', description: 'Op de campus kun je printen op de multifunctionele printers. Volg de stappen om een document te printen.' },
        { title: 'Scannen', url: '/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/scannen', description: 'Met de multifunctionele printers kun je documenten scannen en deze direct naar je e-mail sturen.' }
      ]
    },
    {
      id: 'cat-e-mail-en-agenda',
      label: 'E-mail en agenda',
      url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda',
      pages: [
        { title: 'Agenda delen', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/agenda-delen', description: 'Je kunt je agenda delen met collega\'s zodat zij kunnen zien wanneer je beschikbaar bent voor vergaderingen.' },
        { title: 'Afwezigheid', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/afwezigheid', description: 'Je kunt een automatische \'Afwezig\'-melding instellen als je een tijd niet in de gelegenheid bent om je mail te beantwoorden.' },
        { title: 'Doorsturen', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/doorsturen', description: 'Hier lees je hoe je e-mails kunt doorsturen naar een ander e-mailadres. Dit kan handig zijn als je tijdelijk een andere mailbox gebruikt.' },
        { title: 'Groepsmail', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/groepsmail', description: 'Met groepsmail kun je eenvoudig een e-mail naar een groep mensen sturen. Je hoeft dan niet alle e-mailadressen apart in te voeren.' },
        { title: 'Machtigingen', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/machtigingen', description: 'Je kunt iemand anders machtigen om namens jou je e-mail te beheren of te versturen.' },
        { title: 'Outlook instellen', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/outlook-instellen', description: 'Je kunt Outlook instellen op je apparaat om je Radboud e-mail te ontvangen en te versturen.' },
        { title: 'Postbus verhuizen', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/postbus-verhuizen', description: 'Soms is het nodig om je postbus te verhuizen naar een andere server of locatie.' },
        { title: 'Spam', url: '/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/spam', description: 'Radboud Universiteit filtert spam en phishing-mails automatisch. Toch kan er soms ongewenste mail doorkomen.' },
        { title: 'Vergaderzalen', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/vergaderzalen', description: 'Via Outlook kun je vergaderzalen reserveren voor je meetings. Bekijk de beschikbaarheid en boek direct.' }
      ]
    },
    {
      id: 'cat-beveiliging',
      label: 'Beveiliging',
      url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging',
      pages: [
        { title: 'Bestanden versleutelen', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/beveiliging/bestanden-versleutelen', description: 'Door een bestand te versleutelen zorg je ervoor dat niet iedereen toegang heeft tot dit bestand. Alleen personen met toegang kunnen het bestand inzien.' },
        { title: 'Computer beschermen', url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging/computer-beschermen', description: 'Om je computer te beschermen is het belangrijk om goede antivirussoftware te installeren. Bij langdurig thuiswerken moet je ook wekelijks zelf je apparaat updaten.' },
        { title: 'Fysieke beveiliging van je werkplek', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/beveiliging/fysieke-beveiliging-van-je-werkplek', description: 'Een goede fysieke beveiliging van je werkplek helpt om jouw spullen en die van de universiteit te beschermen.' },
        { title: 'Phishing herkennen', url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging/phishing-herkennen', description: 'Phishing is een vorm van internetfraude. Ontdek hoe je phishing herkent en wat je kunt doen als je er toch intrapt.' },
        { title: 'Tweestapsverificatie', url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging/tweestapsverificatie', description: 'Tweestapsverificatie (2FA) is een extra beveiligingslaag voor je account. Naast je wachtwoord heb je ook een code nodig die naar je telefoon wordt gestuurd.' },
        { title: 'Veilig gedrag', url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging/veilig-gedrag', description: 'Bewust omgaan met je digitale omgeving is essentieel voor de beveiliging van jouw gegevens en die van de universiteit.' },
        { title: 'Veilige bestandsuitwisseling', url: '/services/campusfaciliteiten-gebouwen/ict/beveiliging/veilige-bestandsuitwisseling', description: 'Er zijn meerdere manieren om bestanden veilig uit te wisselen met collega\'s binnen en buiten de universiteit.' }
      ]
    },
    {
      id: 'cat-software',
      label: 'Software',
      url: '/services/campusfaciliteiten-gebouwen/ict/software',
      pages: [
        { title: 'Accountportal', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/software/accountportal', description: 'Medewerkers van de Radboud Universiteit kunnen in de Accountportal onder andere hun wachtwoord wijzigen of toegang tot systemen of werkgroepmappen aanvragen.' },
        { title: 'Archiefweb', url: '/services/campusfaciliteiten-gebouwen/ict/software/archiefweb', description: 'Archiefweb maakt elke dag een kopie van onze website ru.nl en alle onderliggende pagina\'s. Archiefweb is openbaar toegankelijk.' },
        { title: 'OneDrive', url: '/services/campusvoorzieningen/werk-en-studie-ondersteunende-diensten/ict/software/onedrive', description: 'OneDrive (for Business) is de Microsoft-cloudservice waar jouw werk- en studiegerelateerde persoonlijke documenten zijn opgeslagen.' },
        { title: 'Software bij pijn en RSI', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/software/software-bij-pijn-en-rsi', description: 'Het softwareprogramma Workrave kan je helpen om regelmatig te pauzeren als je veel achter je computer of laptop zit. Zo voorkom je pijn aan bijvoorbeeld je arm of pols.' },
        { title: 'Software voor medewerkers', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/software/software-voor-medewerkers', description: 'Als medewerker kun je gebruikmaken van software die wordt aangeboden vanuit de Radboud Universiteit. Je werkplek is voorzien van standaard software. Je kunt aanvullende software installeren of aanvragen.' },
        { title: 'Software voor studenten', url: '/studenten/services/campusfaciliteiten-gebouwen/ict/software/software-voor-studenten', description: 'Als student kun je via Surfspot gratis of tegen zeer gereduceerd tarief softwareprogramma\'s aanschaffen.' },
        { title: 'Teams', url: '/services/campusfaciliteiten-gebouwen/ict/software/teams', description: 'Microsoft Teams is een online samenwerkingstool. Met deze applicatie kun je met mensen binnen en buiten de Radboud Universiteit chatten, (video)bellen, online vergaderen, taken en planningen beheren en real-time samenwerken in documenten.' },
        { title: 'Werkplek up-to-date houden', url: '/medewerkers/services/campusvoorzieningen/werk-en-studie-ondersteunende-diensten/ict/software/werkplek-up-to-date-houden', description: 'Voor de veiligheid is het belangrijk om jouw (privé-)laptops, computers en telefoons te voorzien van de laatste updates.' }
      ]
    },
    {
      id: 'cat-hardware',
      label: 'Hardware',
      url: '/services/campusfaciliteiten-gebouwen/ict/hardware',
      pages: [
        { title: 'Apparatuur aanvragen voor je thuiswerkplek', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/hardware/apparatuur-aanvragen-voor-je-thuiswerkplek', description: 'Werk je langer dan twee uur per dag met een laptop? Dan is het gebruik van een extern beeldscherm, los toetsenbord én losse muis verplicht. Je kunt deze middelen bestellen voor je thuiswerkplek.' },
        { title: 'Audiovisual Services', url: '/services/campusfaciliteiten-gebouwen/audiovisual-services', description: 'Audiovisual Services verleent producten en diensten op multimediagebied aan medewerkers, docenten en studenten van de Radboud Universiteit en het Radboudumc.' },
        { title: 'Hardware voor de werkplek', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/hardware/hardware-voor-de-werkplek', description: 'Als je een nieuwe pc of laptop nodig hebt kan een aanvraagbevoegde deze voor je aanvragen bij Information & Library Services (ILS). ILS maakt het apparaat voor je gereed en helpt je op weg.' },
        { title: 'Radboud Recycle: lever je oude gegevensdragers in', url: '/services/campusfaciliteiten-gebouwen/ict/hardware/radboud-recycle-lever-je-oude-gegevensdragers-in', description: 'Heb je oude privé-gegevensdragers zoals een smartphone, usb-stick, laptop, tablet, harde schijf of pc? Lever ze in en je gegevensdrager wordt door recyclepartner Dustin op een milieubewuste manier verwerkt.' },
        { title: 'Telefoons', url: '/medewerkers/services/campusfaciliteiten-gebouwen/ict/hardware/telefoons', description: 'Als medewerker kun je gebruikmaken van vaste en/of mobiele telefoons. Met vragen over de mogelijkheden bij jouw faculteit of dienst kun je terecht bij jouw telefooncontactpersoon.' }
      ]
    }
  ],
  featured: [
    { title: 'Datalek of beveiligingsincident melden', url: '/services/campusfaciliteiten-gebouwen/ict/datalek-of-beveiligingsincident-melden' },
    { title: 'Gedragsregels informatievoorzieningen Radboud Universiteit', url: '/regelingen/gedragsregels-informatievoorzieningen-radboud-universiteit' },
    { title: 'ICT Helpdesk', url: '/services/campusfaciliteiten-gebouwen/ict/ict-helpdesk' },
    { title: 'ICT Servicepunt', url: '/services/campusfaciliteiten-gebouwen/ict/ict-servicepunt' },
    { title: 'Meerdere accounts', url: '/services/campusfaciliteiten-gebouwen/ict/meerdere-accounts' },
    { title: 'Mijn Radboud-account', url: '/services/campusfaciliteiten-gebouwen/ict/mijn-radboud-account' }
  ]
};

/**
 * Browser Console Script
 * Paste this in the browser console when on a /node/[id]/edit page
 */
const BROWSER_EXTRACTION_SCRIPT = `
// Extract content from Drupal edit form
function extractCurrentPage() {
  const data = {
    nodeId: window.location.pathname.match(/\\/node\\/(\\d+)/)?.[1],
    url: window.location.pathname,
    extractedAt: new Date().toISOString(),
  };

  // Get title (Naam field)
  const titleField = document.querySelector('#edit-title-0-value');
  if (titleField) data.title = titleField.value;

  // Get summary (Samenvatting field - 250 char limit)
  const summaryTextarea = document.evaluate(
    "//label[contains(text(),'Samenvatting')]/following::textarea[1]",
    document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
  );
  if (summaryTextarea.singleNodeValue) {
    data.description = summaryTextarea.singleNodeValue.value;
  }

  // Get body content (Beschrijving - CKEditor)
  const bodyFrame = document.querySelector('.ck-editor__editable');
  if (bodyFrame) data.content = bodyFrame.innerHTML;

  // Get URL alias
  const aliasField = document.querySelector('input[id*="path-0-alias"]');
  if (aliasField) data.urlAlias = aliasField.value;

  // Get publication date
  const pubDateField = document.querySelector('input[id*="publication-date"][id*="value-date"]');
  if (pubDateField) data.publishedAt = pubDateField.value;

  // Get last modified info from sidebar
  const lastSavedText = document.querySelector('[class*="node-info"] .field--name-changed');
  if (lastSavedText) data.lastModified = lastSavedText.textContent.trim();

  // Get Rubriek (category taxonomy) from Extra informatie tab
  const rubriekSelects = document.querySelectorAll('[id*="field-topic"] select');
  if (rubriekSelects.length >= 3) {
    data.rubriek = {
      level1: rubriekSelects[0]?.selectedOptions[0]?.textContent.trim(),
      level2: rubriekSelects[1]?.selectedOptions[0]?.textContent.trim(),
      level3: rubriekSelects[2]?.selectedOptions[0]?.textContent.trim()
    };
  }

  // Get Doelgroep (target audience) checkboxes
  const doelgroepChecked = [...document.querySelectorAll('[id*="field-target-group"] input:checked')]
    .map(cb => cb.nextSibling?.textContent?.trim())
    .filter(Boolean);
  if (doelgroepChecked.length) data.doelgroep = doelgroepChecked;

  console.log('Extracted page data:', data);
  console.log('JSON:', JSON.stringify(data, null, 2));
  return data;
}

// Run extraction
extractCurrentPage();
`;

/**
 * Generate a list of edit URLs from node IDs
 */
function generateEditUrls(nodeIds) {
  return Object.entries(nodeIds).map(([slug, id]) => ({
    slug,
    nodeId: id,
    editUrl: \`https://www.ru.nl/node/\${id}/edit\`
  }));
}

/**
 * Template for updating scraped-content.json with extracted data
 */
function formatForScrapedContent(extractedPages) {
  return extractedPages.map(page => ({
    id: \`page-\${page.nodeId}\`,
    title: page.title || 'Untitled',
    description: page.description || '',
    content: page.content || '',
    url: page.urlAlias || \`/node/\${page.nodeId}\`,
  }));
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ICT_NODE_IDS,
    ICT_STRUCTURE,
    BROWSER_EXTRACTION_SCRIPT,
    generateEditUrls,
    formatForScrapedContent,
  };
}

console.log(\`
==============================================
Drupal Content Extraction Helper
==============================================

ICT Structure Summary (Complete - 2026-01-11):
- 9 Categories
- 53 Pages across all categories
- 6 Featured cards on ICT landing page

Categories:
\${ICT_STRUCTURE.categories.map(c => \`- \${c.label}: \${c.pages.length} pages\`).join('\\n')}

Total pages: \${ICT_STRUCTURE.categories.reduce((sum, c) => sum + c.pages.length, 0)}

To extract content from a Drupal page:

1. Go to the page on ru.nl (e.g., /services/.../veilig-wachtwoord-instellen)
2. Click "Bewerken" in the admin toolbar to get the edit URL
3. Note the node ID from the URL: /node/53060/edit → 53060
4. Open browser console (F12 → Console tab)
5. Paste and run the extraction script
6. Copy the JSON output
7. Add to scraped-content.json

Known node IDs:
\${JSON.stringify(ICT_NODE_IDS, null, 2)}
\`);

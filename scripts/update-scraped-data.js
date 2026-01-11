#!/usr/bin/env node
/**
 * Script to update scraped-content.json with correct page order and missing pages
 * Based on live ru.nl website structure as of 2026-01-10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../src/features/navigation-editor/data/scraped-content.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Correct structure from live ru.nl (as of 2026-01-10)
const correctStructure = {
  'Bestanden delen en samenwerken': [
    'Bestanden veilig delen en opslaan',
    'Bestanden versleuteld versturen met Filesender',
    'Hulp bij informatiebeheer',
    'SURFdrive synchroniseren met bestanden op je apparaat',
    'Toegang werkgroepmappen beheren',
    'Werkgroepmap aanvragen',
    'Werkgroepmappen gebruiken'
  ],
  'Beveiliging': [
    'Bestanden veilig delen en opslaan',
    'Bestanden versleutelen',
    'Computer beschermen',
    'MFA bij Microsoft 365-applicaties',
    'Multi Factor Authentificatie (MFA)',
    'Privacy en persoonsgegevens gebruiken',
    'Tips om veilig te werken'
  ],
  'Buiten de campus werken': [
    'Buiten de campus toegang tot bestanden',
    'Problemen met eduVPN',
    'Radboud-werkplek overnemen',
    'Teams',
    'VPN: buiten de campus toegang tot systemen'
  ],
  'E-mail en agenda': [
    'Agenda, mappen of contacten delen in Outlook',
    'E-mail en agenda op je eigen apparaat zetten',
    'Functionele mailbox aanvragen',
    'Functionele mailbox beheren of opheffen',
    'Mail gebruiken',
    'Mails versturen naar groepen mensen',
    'Privé e-mailadres wijzigen',
    "Vreemde e-mail of 'phishing'"
  ],
  'Hardware': [
    'Apparatuur aanvragen voor je thuiswerkplek',
    'Audiovisual Services',
    'Hardware voor de werkplek',
    'Radboud Recycle: lever je oude gegevensdragers in',
    'Telefoons'
  ],
  'Printen, kopiëren en scannen': [
    'Betaalapp KUARIO',
    'In - en uitloggen printer',
    'Kopiëren',
    'Printen',
    'Scannen'
  ],
  'Software': [
    'Accountportal',
    'Archiefweb',
    'OneDrive',
    'Software bij pijn en RSI',
    'Software voor medewerkers',
    'Software voor studenten',
    'Teams',
    'Werkplek up-to-date houden'
  ],
  'Wachtwoord': [
    'Veilig wachtwoord instellen',
    'Wachtwoord geblokkeerd',
    'Wachtwoord vergeten',
    'Wachtwoord wijzigen'
  ],
  'Wifi': [
    'Eduroam (wifi) werkt niet',
    'Wifi (eduroam) instellen',
    'Wifi voor gasten'
  ]
};

// New pages to add (with descriptions from live site)
const newPages = {
  'SURFdrive synchroniseren met bestanden op je apparaat': {
    description: 'Met SURFdrive kun je bestanden in de cloud synchroniseren met een map op je apparaat.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/bestanden-delen-en-samenwerken/surfdrive-synchroniseren'
  },
  'Tips om veilig te werken': {
    description: 'Tips om je persoonlijke werkwijze en de informatie van de universiteit te beschermen tegen kwaadwillenden.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/beveiliging/tips-om-veilig-te-werken'
  },
  'Privé e-mailadres wijzigen': {
    description: 'Wijzig je externe e-mailadres in BASS onder "Mijn dienstverband".',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/prive-e-mailadres-wijzigen'
  },
  'Audiovisual Services': {
    description: 'Audiovisual Services levert multimediaproducten en -diensten aan medewerkers, docenten en studenten.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/hardware/audiovisual-services'
  },
  'Kopiëren': {
    description: 'Handleiding voor het gebruik van kopieermachines op de campus.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/kopieren'
  },
  'Scannen': {
    description: 'Stapsgewijze instructies voor het scannen van documenten op de campus.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/printen-kopieren-en-scannen/scannen'
  },
  "Vreemde e-mail of 'phishing'": {
    description: 'Als je een e-mail of telefoontje van een onbekende persoon ontvangt met de vraag om informatie te delen, wees dan alert. Het kan phishing zijn.',
    url: 'https://www.ru.nl/services/campusfaciliteiten-gebouwen/ict/e-mail-en-agenda/vreemde-e-mail-of-phishing'
  }
};

// Build a map of all existing pages by title (for reuse)
const existingPages = new Map();
data.categories.forEach(cat => {
  cat.pages.forEach(page => {
    existingPages.set(page.title, page);
  });
});

// Helper to find or create a page
function getOrCreatePage(title, categoryId, pageIndex) {
  const existing = existingPages.get(title);
  if (existing) {
    return {
      ...existing,
      id: `page-${categoryId}-${pageIndex + 1}`
    };
  }

  // Create new page
  const newPageInfo = newPages[title];
  if (newPageInfo) {
    return {
      id: `page-${categoryId}-${pageIndex + 1}`,
      title,
      description: newPageInfo.description,
      content: '',
      url: newPageInfo.url
    };
  }

  console.warn(`Warning: Page "${title}" not found and no template available`);
  return null;
}

// Update categories
let categoryIndex = 1;
data.categories = data.categories.map(cat => {
  const correctOrder = correctStructure[cat.label];

  if (!correctOrder) {
    // Keep category as-is if not in our correct structure
    return cat;
  }

  const catId = categoryIndex;
  const newPages = [];

  correctOrder.forEach((pageTitle, pageIndex) => {
    const page = getOrCreatePage(pageTitle, catId, pageIndex);
    if (page) {
      newPages.push(page);
    }
  });

  categoryIndex++;

  return {
    ...cat,
    id: `cat-${catId}`,
    pages: newPages
  };
});

// Update metadata
const totalPages = data.categories.reduce((sum, cat) => sum + cat.pages.length, 0);
data._meta.scrapedAt = new Date().toISOString();
data._meta.totalPages = totalPages;
data._meta.note = 'Updated to match live ru.nl structure';

// Write updated file
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Updated scraped-content.json');
console.log(`Total categories: ${data.categories.length}`);
console.log(`Total pages: ${totalPages}`);

// Print summary of changes
console.log('\nCategory summary:');
data.categories.forEach(cat => {
  if (correctStructure[cat.label]) {
    console.log(`  ${cat.label}: ${cat.pages.length} pages`);
  }
});

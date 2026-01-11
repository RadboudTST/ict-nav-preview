// Re-export from base structure (the actual ru.nl content)
export { baseStructure, deepClone, cloneWithNewIds } from './base-structure';

// ICT Root Page Data (shared across all structures)
export const ictRootPage = {
  title: 'ICT',
  description: 'Alles over ICT: wifi, VPN, wachtwoorden, printen, software, en meer.',
  banner: {
    title: 'Storingen en onderhoud',
    link: '/storingen',
  },
  quickLinks: [
    { label: 'Wifi (eduroam) instellen', link: '/wifi-instellen' },
    { label: 'Tips om veilig te werken', link: '/veilig-werken' },
  ],
  featuredCards: [
    {
      id: 'featured-1',
      title: 'Datalek of beveiligingsincident melden',
      description: 'Een gestolen telefoon, datalek, virusbesmetting, phishingmail of ander ICT-beveiligingsincident? Meld het zo snel mogelijk.',
    },
    {
      id: 'featured-2',
      title: 'Gedragsregels informatievoorzieningen Radboud Universiteit',
      description: 'Wat zijn de regels en richtlijnen voor het gebruik van ICT- en internetgebruik voor medewerkers en studenten?',
    },
    {
      id: 'featured-3',
      title: 'ICT Helpdesk',
      description: 'De ICT Helpdesk is het aanspreekpunt voor medewerkers en studenten van de Radboud Universiteit voor vragen en problemen op ICT-gebied. Mail icthelpdesk@ru.nl of bel +31 24 362 22 22.',
    },
    {
      id: 'featured-4',
      title: 'ICT Servicepunt',
      description: 'Voor ICT dienstverlening, die niet op afstand geleverd kan worden, is er het ICT Servicepunt in de Hal van de Centrale Bibliotheek.',
    },
    {
      id: 'featured-5',
      title: 'Meerdere accounts',
      description: 'De universiteit is bezig met de overgang van meerdere accounts per persoon naar één account per persoon.',
    },
    {
      id: 'featured-6',
      title: 'Mijn Radboud-account',
      description: 'Iedere werknemer en student bij de Radboud Universiteit krijgt een persoonlijk Radboud-account.',
    },
  ],
};

// For backwards compatibility - export base structure as initialCategories
export { baseStructure as initialCategories } from './base-structure';

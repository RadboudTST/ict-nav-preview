// Re-export from base structure (the actual ru.nl content)
export { baseStructure, featuredCards, deepClone, cloneWithNewIds } from './base-structure';
import { featuredCards } from './base-structure';

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
  // Featured cards from scraped data (source of truth)
  featuredCards,
};

// For backwards compatibility - export base structure as initialCategories
export { baseStructure as initialCategories } from './base-structure';

import { Category } from '../types/navigation.types';
import scrapedData from './scraped-content.json';

// Main category labels to include (filter out single-page entries like ICT Helpdesk)
const MAIN_CATEGORIES = [
  'Bestanden delen en samenwerken',
  'Beveiliging',
  'Buiten de campus werken',
  'E-mail en agenda',
  'Hardware',
  'Printen, kopiëren en scannen',
  'Software',
  'Wachtwoord',
  'Wifi',
];

// Type for the scraped JSON structure
interface ScrapedPage {
  id: string;
  title: string;
  description: string;
  intro?: string;
  content?: string;
  url: string;
}

interface ScrapedCategory {
  id: string;
  label: string;
  description?: string;
  url: string;
  pages: ScrapedPage[];
}

interface ScrapedData {
  _meta: {
    source: string;
    scrapedAt: string;
    totalCategories: number;
    totalPages: number;
  };
  categories: ScrapedCategory[];
}

// Convert scraped data to our Category format
function convertToCategory(scraped: ScrapedCategory, index: number): Category {
  return {
    id: `cat-${index + 1}`,
    label: scraped.label,
    description: scraped.description,
    url: scraped.url,
    isExpanded: true,
    pages: scraped.pages.map((page, pageIndex) => ({
      id: `page-${index + 1}-${pageIndex + 1}`,
      title: page.title,
      description: page.description,
      intro: page.intro,
      content: page.content,
      url: page.url,
    })),
  };
}

// Filter and convert scraped data to base structure
const data = scrapedData as ScrapedData;
const filteredCategories = data.categories
  .filter((cat) => MAIN_CATEGORIES.includes(cat.label))
  .sort((a, b) => {
    // Sort by the order in MAIN_CATEGORIES
    const indexA = MAIN_CATEGORIES.indexOf(a.label);
    const indexB = MAIN_CATEGORIES.indexOf(b.label);
    return indexA - indexB;
  });

// Export the base structure - this is the source of truth from ru.nl
export const baseStructure: Category[] = filteredCategories.map(convertToCategory);

// Utility to deep clone a structure with new IDs
export function cloneWithNewIds(categories: Category[]): Category[] {
  let catCounter = 1;
  return categories.map((cat) => {
    const catId = `cat-${catCounter++}`;
    let pageCounter = 1;
    return {
      ...cat,
      id: catId,
      pages: cat.pages?.map((page) => ({
        ...page,
        id: `${catId}-page-${pageCounter++}`,
      })),
    };
  });
}

// Utility to deep clone a structure (preserving IDs)
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

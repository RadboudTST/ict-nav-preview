import { Category, FeaturedCard } from '../types/navigation.types';
import scrapedData from './scraped-content.json';

// Type for the scraped JSON structure
interface ScrapedPage {
  id: string;
  title: string;
  description: string;
  intro?: string;
  content?: string;
  url: string;
  crossLink?: boolean; // True if this page links to another section
}

interface ScrapedCategory {
  id: string;
  label: string;
  description?: string;
  url: string;
  pages: ScrapedPage[];
}

interface ScrapedFeaturedCard {
  id: string;
  title: string;
  description: string;
  url?: string;
}

interface ScrapedData {
  _meta: {
    source: string;
    scrapedAt: string;
    totalCategories: number;
    totalPages: number;
    totalFeaturedCards?: number;
    note?: string;
  };
  categories: ScrapedCategory[];
  featuredCards?: ScrapedFeaturedCard[];
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
      ...(page.crossLink && { crossLink: true }),
    })),
  };
}

// Convert scraped data to base structure
// The JSON is already filtered and ordered correctly (fixed in scraped-content.json)
const data = scrapedData as ScrapedData;

// Export the base structure - this is the source of truth from ru.nl
export const baseStructure: Category[] = data.categories.map(convertToCategory);

// Export featured cards (shown at bottom of ICT page, not in sidebar)
export const featuredCards: FeaturedCard[] = (data.featuredCards || []).map((card) => ({
  id: card.id,
  title: card.title,
  description: card.description,
  url: card.url,
}));

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

// Utility to deep clone a structure using native structuredClone
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

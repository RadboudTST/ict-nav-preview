import { Category, PageItem } from '../types/navigation.types';
import { generateId } from './tree-helpers';

// Dynamic import for xlsx to reduce initial bundle size
// xlsx is ~500KB and only needed for Excel export/import
const getXLSX = () => import('xlsx');

// =============================================================================
// TYPES
// =============================================================================

type ImportResult = {
  success: true;
  data: Category[];
} | {
  success: false;
  error: string;
};

const IMPORT_ERRORS = {
  UNKNOWN_TYPE: 'Onbekend bestandstype. Gebruik .json, .xlsx of .txt',
  PARSE_FAILED: 'Kon bestand niet lezen',
  NO_CATEGORIES: 'Geen categorieën gevonden in bestand',
  INVALID_JSON: 'JSON structuur niet herkend',
  INVALID_EXCEL: 'Excel moet kolommen Type, Naam bevatten',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function downloadFile(content: string | Blob, filename: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

/**
 * Export to JSON with Dutch field names and metadata
 * Includes full page content (intro, content, sections, url) for comprehensive export
 */
export function downloadJson(categories: Category[], type: 'current' | 'proposed' = 'current'): void {
  const data = {
    _info: {
      title: 'ICT Navigatie Structuur',
      type,
      exportedAt: new Date().toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      version: '1.1', // Bumped version for sections support
    },
    structuur: categories.map(cat => ({
      categorie: cat.label,
      beschrijving: cat.description || undefined,
      url: cat.url || undefined,
      paginas: (cat.pages || []).map(p => ({
        titel: p.title,
        beschrijving: p.description,
        intro: p.intro || undefined,
        inhoud: p.content || undefined,
        url: p.url || undefined,
        // Include sections for full content preservation
        secties: p.sections && p.sections.length > 0
          ? p.sections.map(s => ({
              titel: s.title,
              inhoud: s.content,
            }))
          : undefined,
      })),
    })),
  };

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `ict-structuur-${type}.json`);
}

/**
 * Export to Excel with Type/Naam/Beschrijving columns
 * Uses dynamic import for xlsx to reduce initial bundle size
 * NOTE: Excel format only exports basic structure (category/page names and descriptions).
 * For full content preservation (intro, sections, urls), use JSON export.
 */
export async function downloadExcel(categories: Category[], type: 'current' | 'proposed' = 'current'): Promise<void> {
  const XLSX = await getXLSX();

  const rows: string[][] = [
    ['Type', 'Naam', 'Beschrijving'],
    ['# Instructies: CATEGORIE start een nieuwe categorie, PAGINA hoort bij categorie erboven', '', ''],
  ];

  categories.forEach(cat => {
    rows.push(['CATEGORIE', cat.label, cat.description || '']);
    (cat.pages || []).forEach(page => {
      rows.push(['PAGINA', page.title, page.description]);
    });
    rows.push(['', '', '']); // Empty row for readability
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Structuur');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 },  // Type
    { wch: 40 },  // Naam
    { wch: 60 },  // Beschrijving
  ];

  XLSX.writeFile(workbook, `ict-structuur-${type}.xlsx`);
}

/**
 * Export to readable text format
 * NOTE: Text format only exports basic structure (category/page names and descriptions).
 * For full content preservation (intro, sections, urls), use JSON export.
 */
export function downloadText(categories: Category[], type: 'current' | 'proposed' = 'current'): void {
  const typeLabel = type === 'current' ? 'Huidige' : 'Nieuwe';
  const date = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let text = `ICT NAVIGATIE STRUCTUUR\n`;
  text += `Type: ${typeLabel} structuur\n`;
  text += `Datum: ${date}\n`;
  text += `${'='.repeat(40)}\n\n`;

  categories.forEach(cat => {
    text += `${cat.label.toUpperCase()}\n`;
    if (cat.description) {
      text += `  ${cat.description}\n`;
    }
    (cat.pages || []).forEach(page => {
      text += `  • ${page.title}\n`;
      if (page.description) {
        text += `    ${page.description}\n`;
      }
    });
    text += '\n';
  });

  downloadFile(text, `ict-structuur-${type}.txt`);
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

/**
 * Normalize category from various field names
 * Handles url field from JSON exports
 */
function normalizeCategory(input: Record<string, unknown>): Category {
  const label = (input.label || input.categorie || input.category || input.naam || input.name || 'Naamloos') as string;
  const description = (input.description || input.beschrijving || '') as string;
  const url = (input.url || undefined) as string | undefined;
  const pagesInput = (input.pages || input.paginas || input.items || []) as Record<string, unknown>[];

  return {
    id: generateId(),
    label,
    description: description || undefined,
    url,
    isExpanded: true,
    pages: pagesInput.map(normalizePageItem),
  };
}

/**
 * Normalize a content section from import
 */
function normalizeSection(input: Record<string, unknown>): { id: string; title: string; content: string } {
  return {
    id: generateId(),
    title: (input.title || input.titel || input.naam || '') as string,
    content: (input.content || input.inhoud || input.tekst || '') as string,
  };
}

/**
 * Normalize page item from various field names
 * Handles full content fields (intro, content, sections, url) from JSON exports
 */
function normalizePageItem(input: Record<string, unknown>): PageItem {
  // Parse sections if present
  const sectionsInput = (input.sections || input.secties || []) as Record<string, unknown>[];
  const sections = sectionsInput.length > 0
    ? sectionsInput.map(normalizeSection)
    : undefined;

  return {
    id: generateId(),
    title: (input.title || input.titel || input.naam || input.name || 'Naamloos') as string,
    description: (input.description || input.beschrijving || input.desc || '') as string,
    intro: (input.intro || undefined) as string | undefined,
    content: (input.content || input.inhoud || undefined) as string | undefined,
    url: (input.url || undefined) as string | undefined,
    sections,
  };
}

/**
 * Parse JSON import
 */
function parseJson(text: string): ImportResult {
  try {
    const data = JSON.parse(text);

    // Handle our export format with structuur
    if (data.structuur && Array.isArray(data.structuur)) {
      const categories = data.structuur.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories };
    }

    // Handle categories array
    if (data.categories && Array.isArray(data.categories)) {
      const categories = data.categories.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories };
    }

    // Handle direct array
    if (Array.isArray(data)) {
      const categories = data.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories };
    }

    return { success: false, error: IMPORT_ERRORS.INVALID_JSON };
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}

/**
 * Parse Excel import
 * Uses dynamic import for xlsx to reduce initial bundle size
 */
async function parseExcel(file: File): Promise<ImportResult> {
  try {
    const XLSX = await getXLSX();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    if (rows.length < 2) {
      return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
    }

    // Find header row and column indices
    const headerRow = (rows[0] || []).map(h => String(h || '').toLowerCase().trim());
    const typeCol = headerRow.findIndex(h => ['type', 'typ'].includes(h));
    const nameCol = headerRow.findIndex(h => ['naam', 'name', 'titel', 'title'].includes(h));
    const descCol = headerRow.findIndex(h => ['beschrijving', 'description', 'desc'].includes(h));

    if (typeCol === -1 || nameCol === -1) {
      return { success: false, error: IMPORT_ERRORS.INVALID_EXCEL };
    }

    const categories: Category[] = [];
    let currentCategory: Category | null = null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const type = String(row[typeCol] || '').toUpperCase().trim();
      const name = String(row[nameCol] || '').trim();
      const desc = descCol >= 0 ? String(row[descCol] || '').trim() : '';

      // Skip instruction rows and empty names
      if (!name || name.startsWith('#')) continue;

      if (['CATEGORIE', 'CATEGORY', 'CAT'].includes(type)) {
        currentCategory = {
          id: generateId(),
          label: name,
          description: desc || undefined,
          isExpanded: true,
          pages: [],
        };
        categories.push(currentCategory);
      } else if (['PAGINA', 'PAGE', 'PAG'].includes(type) && currentCategory) {
        currentCategory.pages = currentCategory.pages || [];
        currentCategory.pages.push({
          id: generateId(),
          title: name,
          description: desc,
        });
      }
    }

    if (categories.length === 0) {
      return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
    }

    return { success: true, data: categories };
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}

/**
 * Parse text import
 */
function parseText(text: string): ImportResult {
  try {
    const lines = text.split('\n');
    const categories: Category[] = [];
    let currentCategory: Category | null = null;
    let lastPageDescription: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip header lines
      if (trimmed.startsWith('ICT NAVIGATIE') ||
          trimmed.startsWith('Type:') ||
          trimmed.startsWith('Datum:') ||
          trimmed.startsWith('===') ||
          trimmed === '') {
        continue;
      }

      // All caps line = category (but not if it starts with bullet)
      if (/^[A-Z][A-Z0-9\s,\-&]+$/.test(trimmed) && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        // Save any pending description
        if (currentCategory && currentCategory.pages && currentCategory.pages.length > 0 && lastPageDescription.length > 0) {
          const lastPage = currentCategory.pages[currentCategory.pages.length - 1];
          if (!lastPage.description) {
            lastPage.description = lastPageDescription.join(' ');
          }
        }
        lastPageDescription = [];

        currentCategory = {
          id: generateId(),
          label: trimmed.charAt(0) + trimmed.slice(1).toLowerCase(),
          isExpanded: true,
          pages: [],
        };
        categories.push(currentCategory);
      }
      // Bullet point = page
      else if ((line.match(/^\s+[•\-]\s/) || line.match(/^\s{2,}[•\-]/)) && currentCategory) {
        // Save previous page description
        if (currentCategory.pages && currentCategory.pages.length > 0 && lastPageDescription.length > 0) {
          const lastPage = currentCategory.pages[currentCategory.pages.length - 1];
          if (!lastPage.description) {
            lastPage.description = lastPageDescription.join(' ');
          }
        }
        lastPageDescription = [];

        const pageTitle = trimmed.replace(/^[•\-]\s*/, '').trim();
        currentCategory.pages = currentCategory.pages || [];
        currentCategory.pages.push({
          id: generateId(),
          title: pageTitle,
          description: '',
        });
      }
      // Indented line after bullet = description
      else if (line.match(/^\s{4,}/) && currentCategory && currentCategory.pages && currentCategory.pages.length > 0) {
        lastPageDescription.push(trimmed);
      }
    }

    // Handle last page description
    if (currentCategory && currentCategory.pages && currentCategory.pages.length > 0 && lastPageDescription.length > 0) {
      const lastPage = currentCategory.pages[currentCategory.pages.length - 1];
      if (!lastPage.description) {
        lastPage.description = lastPageDescription.join(' ');
      }
    }

    if (categories.length === 0) {
      return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
    }

    return { success: true, data: categories };
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}

/**
 * Main import function - handles JSON, Excel, and Text files
 */
export async function importStructure(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.json')) {
    const text = await file.text();
    return parseJson(text);
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseExcel(file);
  }

  if (name.endsWith('.txt') || name.endsWith('.csv')) {
    const text = await file.text();
    return parseText(text);
  }

  return { success: false, error: IMPORT_ERRORS.UNKNOWN_TYPE };
}


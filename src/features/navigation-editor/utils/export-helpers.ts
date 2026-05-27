import DOMPurify from 'dompurify';
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
  format: 'JSON' | 'Excel' | 'Tekst';
  warnings?: string[];
} | {
  success: false;
  error: string;
};

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 50000;

const IMPORT_ERRORS = {
  UNKNOWN_TYPE: 'Onbekend bestandstype. Gebruik .json, .xlsx of .txt',
  PARSE_FAILED: 'Kon bestand niet lezen',
  NO_CATEGORIES: 'Geen categorieën gevonden in bestand',
  INVALID_JSON: 'JSON structuur niet herkend',
  INVALID_EXCEL: 'Excel moet kolommen Type, Naam bevatten',
  FILE_TOO_LARGE: `Bestand te groot. Maximum is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Collects warnings during import to surface to the user.
 * Reset before each import operation.
 */
const importWarnings: string[] = [];

/**
 * Truncate string to max length to prevent localStorage overflow.
 * Records a warning when truncation occurs so the user is informed.
 */
function truncateString(str: string | undefined, maxLength: number, fieldName?: string): string | undefined {
  if (!str) return undefined;
  if (str.length > maxLength) {
    const label = fieldName || 'Veld';
    importWarnings.push(`${label} ingekort van ${str.length} naar ${maxLength} tekens`);
    return str.slice(0, maxLength);
  }
  return str;
}

/**
 * Safely extract a string from unknown value
 * Returns defaultValue if the value is not a string
 */
function safeString(value: unknown, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return defaultValue;
}

/**
 * Safely extract an optional string from unknown value
 * Returns undefined if the value is not a string
 */
function safeOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

/**
 * Safely extract a boolean from unknown value
 */
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 'ja' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'nee' || value === 'no') return false;
  return undefined;
}

/**
 * Safely extract an array from unknown value
 */
function safeArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value;
  return [];
}

function downloadFile(content: string | Blob, filename: string): void {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('[Export] Failed to download file:', error);
    throw new Error('Kon bestand niet downloaden. Probeer het opnieuw.');
  }
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
      version: '1.2', // Bumped version for category content sections support
    },
    structuur: categories.map(cat => ({
      categorie: cat.label,
      beschrijving: cat.description || undefined,
      url: cat.url || undefined,
      inhoud: cat.content || undefined,
      accordion: cat.useAccordion || undefined,
      secties: cat.sections
        ? cat.sections.map(s => ({ titel: s.title, inhoud: s.content }))
        : undefined,
      paginas: (cat.pages || []).map(p => ({
        titel: p.title,
        beschrijving: p.description,
        intro: p.intro || undefined,
        inhoud: p.content || undefined,
        url: p.url || undefined,
        externeLink: p.crossLink || undefined, // Cross-link indicator
        accordion: p.useAccordion || undefined, // Accordion display mode
        laatstGewijzigd: p.lastModified || undefined, // Last modified timestamp
        // Include sections for full content preservation
        // Export empty array explicitly to preserve round-trip fidelity
        secties: p.sections
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
  try {
    const XLSX = await getXLSX();

    const rows: string[][] = [
      ['Type', 'Naam', 'Beschrijving', 'Externe Link'],
      ['# Instructies: CATEGORIE start een nieuwe categorie, PAGINA hoort bij categorie erboven', '', '', ''],
    ];

    categories.forEach(cat => {
      rows.push(['CATEGORIE', cat.label, cat.description || '', '']);
      (cat.pages || []).forEach(page => {
        rows.push(['PAGINA', page.title, page.description, page.crossLink ? 'Ja' : '']);
      });
      rows.push(['', '', '', '']); // Empty row for readability
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Structuur');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 },  // Type
      { wch: 40 },  // Naam
      { wch: 60 },  // Beschrijving
      { wch: 12 },  // Externe Link
    ];

    XLSX.writeFile(workbook, `ict-structuur-${type}.xlsx`);
  } catch (error) {
    console.error('[Export] Failed to export Excel:', error);
    throw new Error('Kon Excel bestand niet maken. Probeer het opnieuw.');
  }
}

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

/**
 * Normalize category from various field names
 * Handles url field from JSON exports
 * Uses type guards for safe value extraction
 */
function normalizeCategory(input: Record<string, unknown>): Category {
  const label = safeString(
    input.label || input.categorie || input.category || input.naam || input.name,
    'Naamloos'
  );
  const description = safeOptionalString(input.description || input.beschrijving);
  const url = safeOptionalString(input.url);

  const sectionsInput = safeArray(input.sections || input.secties);
  const sections = sectionsInput.length > 0 ? sectionsInput.map(normalizeSection) : undefined;
  const rawContent = truncateString(
    safeOptionalString(input.content || input.inhoud),
    MAX_CONTENT_LENGTH,
    `Inhoud van categorie "${label}"`
  );
  const content = sanitizeHtml(rawContent);
  const useAccordion = safeBoolean(input.useAccordion || input.accordion) || undefined;

  const pagesInput = safeArray(input.pages || input.paginas || input.items);

  return {
    id: generateId(),
    label,
    description,
    url,
    content,
    sections,
    useAccordion,
    isExpanded: true,
    pages: pagesInput.map(normalizePageItem),
  };
}

/**
 * Normalize a content section from import
 * Uses type guards for safe value extraction
 */
function normalizeSection(input: Record<string, unknown>): { id: string; title: string; content: string } {
  return {
    id: generateId(),
    title: safeString(input.title || input.titel || input.naam),
    content: DOMPurify.sanitize(safeString(input.content || input.inhoud || input.tekst), SANITIZE_CONFIG),
  };
}

/**
 * Normalize page item from various field names
 * Handles full content fields (intro, content, sections, url, crossLink) from JSON exports
 * Validates crossLink requires URL and truncates long strings
 * Uses type guards for safe value extraction
 */
/**
 * Sanitize HTML content from imports to prevent XSS.
 * TipTap sanitizes content entered via the editor, but JSON imports
 * bypass TipTap and go straight to the store → dangerouslySetInnerHTML.
 */
/**
 * DOMPurify configuration that strips dangerous tags.
 * A hook removes ALL on* event handler attributes (not just a hardcoded list).
 */
const SANITIZE_CONFIG = {
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style', 'svg', 'math'],
};

// Hook: strip all on* event handler attributes from every node
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName.startsWith('on')) {
    data.keepAttr = false;
  }
});

function sanitizeHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

function normalizePageItem(input: Record<string, unknown>): PageItem {
  // Parse sections if present (with type guard)
  const sectionsInput = safeArray(input.sections || input.secties);
  const sections = sectionsInput.length > 0
    ? sectionsInput.map(normalizeSection)
    : undefined;

  // Parse crossLink from various field names (with type guard)
  const crossLinkValue = safeBoolean(input.crossLink || input.externeLink || input.externalLink);
  const url = truncateString(
    safeOptionalString(input.url),
    MAX_CONTENT_LENGTH
  );

  // crossLink is a marker independent of URL (e.g. Excel imports have no URL)
  const crossLink = crossLinkValue ? true : undefined;

  // Truncate title and description to prevent localStorage issues
  const rawTitle = safeString(input.title || input.titel || input.naam || input.name, 'Naamloos');
  const title = truncateString(rawTitle, MAX_TITLE_LENGTH, `Titel "${rawTitle.slice(0, 30)}"`) || 'Naamloos';

  const description = truncateString(
    safeString(input.description || input.beschrijving || input.desc),
    MAX_DESCRIPTION_LENGTH,
    `Beschrijving van "${title}"`
  ) ?? '';

  // Field precedence: `content` wins over `inhoud` if both are present
  const rawContent = truncateString(
    safeOptionalString(input.content || input.inhoud),
    MAX_CONTENT_LENGTH,
    `Inhoud van "${title}"`
  );

  return {
    id: generateId(),
    title,
    description,
    intro: sanitizeHtml(truncateString(safeOptionalString(input.intro), MAX_CONTENT_LENGTH, `Intro van "${title}"`)),
    content: sanitizeHtml(rawContent),
    url,
    crossLink,
    useAccordion: safeBoolean(input.useAccordion || input.accordion) || undefined,
    lastModified: safeOptionalString(input.lastModified || input.laatstGewijzigd),
    sections,
  };
}

/**
 * Parse JSON import
 */
function parseJson(text: string): ImportResult {
  try {
    importWarnings.length = 0; // Reset warnings
    const data = JSON.parse(text);

    // Handle our export format with structuur
    if (data.structuur && Array.isArray(data.structuur)) {
      const categories = data.structuur.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories, format: 'JSON', warnings: importWarnings.length > 0 ? [...importWarnings] : undefined };
    }

    // Handle categories array
    if (data.categories && Array.isArray(data.categories)) {
      const categories = data.categories.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories, format: 'JSON', warnings: importWarnings.length > 0 ? [...importWarnings] : undefined };
    }

    // Handle direct array
    if (Array.isArray(data)) {
      const categories = data.map(normalizeCategory);
      if (categories.length === 0) {
        return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
      }
      return { success: true, data: categories, format: 'JSON', warnings: importWarnings.length > 0 ? [...importWarnings] : undefined };
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
    importWarnings.length = 0; // Reset warnings
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
    const crossLinkCol = headerRow.findIndex(h => ['externe link', 'externelink', 'crosslink', 'external'].includes(h));

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
      const crossLinkValue = crossLinkCol >= 0 ? String(row[crossLinkCol] || '').toLowerCase().trim() : '';
      const isCrossLink = ['ja', 'yes', 'true', '1', 'x'].includes(crossLinkValue);

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
          crossLink: isCrossLink || undefined,
        });
      }
    }

    if (categories.length === 0) {
      return { success: false, error: IMPORT_ERRORS.NO_CATEGORIES };
    }

    return { success: true, data: categories, format: 'Excel', warnings: importWarnings.length > 0 ? [...importWarnings] : undefined };
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}

/**
 * Parse text import
 */
function parseText(text: string): ImportResult {
  try {
    importWarnings.length = 0; // Reset warnings
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
      if (/^[\p{Lu}][\p{Lu}\p{N}\s,\-&.()]+$/u.test(trimmed) && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
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

    return { success: true, data: categories, format: 'Tekst', warnings: importWarnings.length > 0 ? [...importWarnings] : undefined };
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}

/**
 * Main import function - handles JSON, Excel, and Text files
 * Validates file size before processing
 */
export async function importStructure(file: File): Promise<ImportResult> {
  // Check file size limit
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: IMPORT_ERRORS.FILE_TOO_LARGE };
  }

  const name = file.name.toLowerCase();

  try {
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
  } catch {
    return { success: false, error: IMPORT_ERRORS.PARSE_FAILED };
  }
}


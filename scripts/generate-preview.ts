/**
 * Generate standalone preview site from the final JSON export.
 *
 * Usage:
 *   npx tsx scripts/generate-preview.ts
 *
 * Output:
 *   preview-site/index.html   — self-contained HTML, no external deps
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateStandaloneHtml } from '../src/features/navigation-editor/utils/export-html.js';
import type { Category, PageItem, ContentSection } from '../src/features/navigation-editor/types/navigation.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const INPUT_JSON = resolve(ROOT, 'Final', 'ict-structuur-proposed (final).json');
const OUTPUT_DIR = resolve(ROOT, 'preview-site');
const OUTPUT_HTML = resolve(OUTPUT_DIR, 'index.html');

// ---------------------------------------------------------------------------
// Helpers (mirrors export-helpers.ts field mapping, sans browser DOMPurify)
// ---------------------------------------------------------------------------

function generateId(): string {
  return `item-${crypto.randomUUID()}`;
}

function safeStr(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function safeOptStr(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
}

function safeBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 'ja' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'nee' || value === 'no') return false;
  return undefined;
}

function safeArr(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value as Record<string, unknown>[];
  return [];
}

function normalizeSection(raw: Record<string, unknown>): ContentSection {
  return {
    id: generateId(),
    title: safeStr(raw.title ?? raw.titel ?? raw.naam),
    content: safeStr(raw.content ?? raw.inhoud ?? raw.tekst),
  };
}

function normalizePageItem(raw: Record<string, unknown>): PageItem {
  const title = safeStr(raw.title ?? raw.titel ?? raw.naam ?? raw.name, 'Naamloos');
  const description = safeStr(raw.description ?? raw.beschrijving ?? raw.desc);
  const sections = safeArr(raw.sections ?? raw.secties);

  return {
    id: generateId(),
    title,
    description,
    intro: safeOptStr(raw.intro),
    content: safeOptStr(raw.content ?? raw.inhoud),
    url: safeOptStr(raw.url),
    crossLink: safeBool(raw.crossLink ?? raw.externeLink ?? raw.externalLink) || undefined,
    useAccordion: safeBool(raw.useAccordion ?? raw.accordion) || undefined,
    lastModified: safeOptStr(raw.lastModified ?? raw.laatstGewijzigd),
    sections: sections.length > 0 ? sections.map(normalizeSection) : undefined,
  };
}

function normalizeCategory(raw: Record<string, unknown>): Category {
  const label = safeStr(raw.label ?? raw.categorie ?? raw.category ?? raw.naam ?? raw.name, 'Naamloos');
  const pagesRaw = safeArr(raw.pages ?? raw.paginas ?? raw.items);
  const sectionsRaw = safeArr(raw.sections ?? raw.secties);

  return {
    id: generateId(),
    label,
    description: safeOptStr(raw.description ?? raw.beschrijving),
    url: safeOptStr(raw.url),
    content: safeOptStr(raw.content ?? raw.inhoud),
    useAccordion: safeBool(raw.useAccordion ?? raw.accordion) || undefined,
    sections: sectionsRaw.length > 0 ? sectionsRaw.map(normalizeSection) : undefined,
    isExpanded: true,
    pages: pagesRaw.map(normalizePageItem),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('📂 Reading:', INPUT_JSON);
const raw = readFileSync(INPUT_JSON, 'utf-8');
const data = JSON.parse(raw) as Record<string, unknown>;

// Support structuur / categories / direct array
let structuur: Record<string, unknown>[];
if (data.structuur && Array.isArray(data.structuur)) {
  structuur = data.structuur as Record<string, unknown>[];
} else if (data.categories && Array.isArray(data.categories)) {
  structuur = data.categories as Record<string, unknown>[];
} else if (Array.isArray(data)) {
  structuur = data as Record<string, unknown>[];
} else {
  console.error('❌ Geen categorieën gevonden in JSON. Verwacht veld "structuur" of "categories".');
  process.exit(1);
}

const categories: Category[] = structuur.map(normalizeCategory);
console.log(`✅ ${categories.length} categorieën geladen`);
categories.forEach(c => console.log(`   • ${c.label} (${(c.pages ?? []).length} pagina's)`));

console.log('\n🔨 HTML genereren...');
const html = generateStandaloneHtml(categories, 'proposed');

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(OUTPUT_HTML, html, 'utf-8');

const sizeKb = Math.round(Buffer.byteLength(html, 'utf-8') / 1024);
console.log(`\n✅ Gegenereerd: ${OUTPUT_HTML}`);
console.log(`   Bestandsgrootte: ${sizeKb} KB`);
console.log('\n🚀 Klaar! Open preview-site/index.html in een browser om te controleren.');

# RU Navigation Editor

WYSIWYG navigation editor for Radboud University ICT services page restructure.

## Quick Reference

| Item | Value |
|------|-------|
| Storage Key | `ru-nav-editor-state-v20` |
| Dev Server | `npm run dev` → localhost:5173 |
| TypeCheck | `npm run typecheck` |
| Build | `npm run build` |
| Total Pages | 47 (43 direct + 4 cross-links) |
| Categories | 9 |

## Architecture Overview

```
Two Structures:
├── current (READ-ONLY) → Original ru.nl from scraped-content.json
└── proposed (EDITABLE) → User's restructure proposal

Three View Modes:
├── edit    → Sidebar tree + MainContent cards
├── preview → ru.nl-style rendering
└── compare → Side-by-side diff with sync scrolling
```

## Data Model

```typescript
// Flat 2-level hierarchy matching ru.nl
interface Category {
  id: string;
  label: string;
  description?: string;
  url?: string;
  content?: string;           // Rich text intro for category view
  sections?: ContentSection[]; // Optional content sections (shown above page grid)
  useAccordion?: boolean;     // Render sections as accordion in preview/export
  isExpanded: boolean;
  pages?: PageItem[];
}

interface PageItem {
  id: string;
  title: string;
  description: string;
  intro?: string;
  content?: string;
  sections?: ContentSection[];
  url?: string;
  crossLink?: boolean;        // True for external links (/handleidingen/, /medewerkers/)
  useAccordion?: boolean;     // Render sections as accordion in preview
  lastModified?: string;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;            // HTML from TipTap
}
```

## Cross-Links

Pages that link to sections outside ICT (e.g., `/handleidingen/`, `/medewerkers/`) are marked with `crossLink: true`.

**Current Cross-Links (4):**
| Page | Section | URL |
|------|---------|-----|
| SURFdrive synchroniseren | Bestanden delen | `/en/manuals/synchronising-surfdrive...` |
| Kopiëren | Printen | `/handleidingen/kopieren` |
| Scannen | Printen | `/handleidingen/scannen` |
| Privé e-mailadres wijzigen | E-mail | `/handleidingen/prive-e-mailadres-wijzigen` |

**UI Rendering:**
- Blue ExternalLink icon (instead of FileText)
- Italic text
- "Externe link" badge

## Critical File Paths

| Purpose | File |
|---------|------|
| Store (all state) | `hooks/useNavigationStore.ts` |
| Types | `types/navigation.types.ts` |
| Base data | `data/scraped-content.json` |
| DnD logic | `components/Sidebar.tsx` |
| Export/Import | `utils/export-helpers.ts` |
| HTML Export | `utils/export-html.ts` |
| HTML Sanitizer | `components/HtmlPreview.tsx` |
| Error Boundary | `src/components/ui/ErrorBoundary.tsx` |

*All paths relative to `src/features/navigation-editor/`*

## Store Actions (useNavigationStore)

### Structure Management
```typescript
setActiveStructure('current' | 'proposed')  // Sets isReadOnly automatically
importStructure(categories: Category[])      // Only when proposed active
exportToJson() / exportToExcel()
reset() / resetCurrentStructure() / resetToBaseStructure()
```

### Category CRUD
```typescript
addCategory(label: string)
updateLabel(id: string, label: string)
updateCategoryDescription(id: string, description: string)
deleteItem(id: string)
reorderCategories(activeId: string, overId: string)
toggleExpand(id: string)
```

### Page CRUD
```typescript
addPage(parentId, title, description)
updatePage(parentId, pageId, title, description)
deletePage(parentId, pageId)
reorderPages(parentId, activeId, overId)
movePageToCategory(fromCategoryId, toCategoryId, pageId)
```

### Page Content Editing
```typescript
selectPage(parentId, pageId) / clearSelectedPage()
updatePageContent(parentId, pageId, updates: Partial<PageItem>)
addPageSection(parentId, pageId, title)
updatePageSection(parentId, pageId, sectionId, updates)
deletePageSection(parentId, pageId, sectionId)
reorderPageSections(parentId, pageId, fromIndex, toIndex)
```

### Compare Mode
```typescript
getDifferenceType(
  itemLabel: string,
  variant: 'current' | 'proposed',
  itemType: 'category' | 'page',
  categoryLabel?: string
): DifferenceType  // 'new' | 'removed' | 'moved' | 'unchanged'

setHighlightDifferences(boolean)
```

## State Update Pattern

**ALWAYS use this pattern for mutations:**

```typescript
set((state) =>
  syncCategories(
    produce(state, (draft) => {
      const categories = draft.structures[draft.activeStructure];
      // mutations here
    })
  )
)
```

## Read-Only Mode

When `activeStructure === 'current'`, `isReadOnly` is `true`.

**Components must:**
1. Accept `isReadOnly` prop
2. Hide edit controls (drag handles, delete buttons, add buttons)
3. Disable inline editing (pass `disabled` to EditableText/TipTap)
4. Disable DnD (`disabled: isReadOnly` in useSortable/useDroppable)

## Export Formats

### JSON (Full data preservation)
```json
{
  "_info": { "version": "1.2", "type": "current|proposed" },
  "structuur": [{
    "categorie": "Label",
    "beschrijving": "Category description",
    "url": "https://...",
    "inhoud": "<p>Optional rich text intro for this category</p>",
    "accordion": true,
    "secties": [{ "titel": "Section", "inhoud": "<p>HTML</p>" }],
    "paginas": [{
      "titel": "Page title",
      "beschrijving": "Short description",
      "intro": "Intro text",
      "inhoud": "Legacy content",
      "url": "https://...",
      "externeLink": true,
      "secties": [{ "titel": "Section", "inhoud": "<p>HTML</p>" }]
    }]
  }]
}
```

### Excel
| Type | Naam | Beschrijving | Externe Link |
|------|------|--------------|--------------|
| CATEGORIE | Label | Description | |
| PAGINA | Title | Description | Ja |

### Text
```
CATEGORIE NAAM
  • Page title [↗ Externe link]
    Description
```

## Import Field Mapping

| Internal | Also Accepts |
|----------|--------------|
| `label` | `categorie`, `category`, `naam`, `name` |
| `description` | `beschrijving`, `desc` |
| `pages` | `paginas`, `items` |
| `content` (cat) | `inhoud` |
| `sections` (cat) | `secties` |
| `useAccordion` (cat) | `accordion` |
| `title` | `titel`, `naam`, `name` |
| `sections` (page) | `secties` |
| `content` (page) | `inhoud` |
| `crossLink` | `externeLink`, `externalLink` |

**Excel "Externe Link" column:** Accepts `Ja`, `Yes`, `True`, `1`, `X`

## DnD Implementation (Sidebar.tsx)

```typescript
// Custom collision detection priority:
// 1. category-drop-zone (for cross-category page moves)
// 2. page in different category (cross-category)
// 3. page in same category (reordering)

useSortable({
  id: item.id,
  data: {
    type: 'category' | 'page',
    categoryId: string,  // Required for pages
  },
  disabled: isReadOnly,
})
```

## Component Hierarchy

```
App (+ storage-quota-exceeded listener)
├── Header (view mode toggle)
├── Toolbar (structure switch, export, import, warning toasts)
└── Content Area
    ├── [edit mode]
    │   ├── Sidebar (DndContext, DnD disabled during search)
    │   │   └── CategoryItem (useSortable + useDroppable)
    │   │       └── PageItem (useSortable)
    │   └── MainContent
    │       ├── PageCard[] (useSortable, disabled in read-only)
    │       └── InlinePageEditor (slide-out panel)
    │           └── InlineSectionEditor[] (DndContext, disabled in read-only)
    ├── [preview mode]
    │   └── ErrorBoundary → PreviewLayout
    │       ├── PreviewSidebar (falls back for unknown categories)
    │       └── PreviewMainContent / PreviewPageDetail
    └── [compare mode]
        └── ErrorBoundary → CompareLayout (sync scroll)
            ├── CompareColumn (current)
            └── CompareColumn (proposed)
```

## Security & Resilience

- **HTML sanitization**: DOMPurify with hook stripping all `on*` attributes. Applied in `export-helpers.ts` (import), `HtmlPreview.tsx` (render), and `export-html.ts` (HTML export uses `escapeHtml()` for text fields).
- **Link validation**: TipTap link prompt rejects `javascript:`, `data:`, `vbscript:` URLs.
- **Safe localStorage**: Custom storage wrapper catches `QuotaExceededError` and dispatches `storage-quota-exceeded` event (listened in App.tsx).
- **Import warnings**: `ImportResult.warnings` array tracks truncation and issues; displayed as toast in Toolbar.
- **ErrorBoundary**: Wraps Preview and Compare modes; resets to edit mode on crash.

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Old data showing | Bump storage version in useNavigationStore.ts |
| DnD not working | Check isReadOnly, verify DndContext wraps elements |
| Pages not moving between categories | Collision detection needs `data.type` |
| State not syncing | Missing `syncCategories` wrapper |
| Compare shows wrong diff | Ensure `getDifferenceType` receives `categoryLabel` for pages |
| Editing in read-only | Pass `isReadOnly` prop down component tree |
| Sections not exporting | Use JSON format (Excel/Text don't support sections) |
| Cross-links not showing | Check `crossLink: true` in scraped-content.json |
| Exported HTML looks different from preview | `export-html.ts` has its own inline CSS — must be updated manually when preview styles change. Cross-check against `globals.css` (`.ru-rich-text`) and `components/preview/` |

## Styling (Radboud Brand)

| Token | Color | Usage |
|-------|-------|-------|
| `ru-red-impact` | #e3000b | Primary actions, accents |
| `ru-maroon` | #730e04 | Headers |
| `ru-mahogany` | #4a0004 | Sidebar header text |
| `ru-blue` | #008acb | Links, cross-link icons |
| `ru-green` | #4aa943 | Success states |
| `ru-gray` | #797777 | Secondary text |
| `ru-light-gray` | #f5f5f5 | Backgrounds |
| `ru-border` | #e0e0e0 | Borders |
| `ru-text` | #333333 | Primary text |

## Updating Scraped Data

1. Edit `data/scraped-content.json`
2. Update `_meta` counts if pages added/removed
3. Add `crossLink: true` for external links
4. Bump storage version: `STORAGE_KEY = 'ru-nav-editor-state-vN'`
5. Run `npm run typecheck`

## Tech Stack

| Package | Purpose |
|---------|---------|
| React 19 | UI framework |
| Zustand 5 + zundo | State + undo/redo (200-action limit) |
| Immer | Immutable updates |
| @dnd-kit/* | Drag and drop |
| TipTap | Rich text editor |
| xlsx (SheetJS) | Excel export (dynamic import) |
| DOMPurify | HTML sanitization (import + preview) |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |

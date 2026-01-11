# RU Navigation Editor

WYSIWYG navigation editor for Radboud University ICT services page restructure.

## Quick Reference

| Item | Value |
|------|-------|
| Storage Key | `ru-nav-editor-state-v9` |
| Dev Server | `npm run dev` → localhost:5173 |
| TypeCheck | `npm run typecheck` |
| Build | `npm run build` |

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
  description?: string;        // Editable via double-click
  url?: string;
  isExpanded: boolean;
  pages?: PageItem[];
}

interface PageItem {
  id: string;
  title: string;
  description: string;         // Card preview text
  intro?: string;              // Full intro paragraph
  content?: string;            // Legacy content field
  sections?: ContentSection[]; // Rich content sections
  url?: string;
  lastModified?: string;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;             // HTML from TipTap
}
```

## Critical File Paths

| Purpose | File |
|---------|------|
| Store (all state) | `src/features/navigation-editor/hooks/useNavigationStore.ts` |
| Types | `src/features/navigation-editor/types/navigation.types.ts` |
| Base data | `src/features/navigation-editor/data/scraped-content.json` |
| DnD logic | `src/features/navigation-editor/components/Sidebar.tsx` |
| Export/Import | `src/features/navigation-editor/utils/export-helpers.ts` |

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
updateCategoryDescription(id: string, description: string)  // NEW
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
  categoryLabel?: string          // Required for pages
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

## Export Format Details

### JSON (Full data preservation)
```json
{
  "_info": { "version": "1.1", "type": "current|proposed" },
  "structuur": [{
    "categorie": "Label",
    "beschrijving": "Category description",
    "url": "https://...",
    "paginas": [{
      "titel": "Page title",
      "beschrijving": "Short description",
      "intro": "Intro text",
      "inhoud": "Legacy content",
      "url": "https://...",
      "secties": [{ "titel": "Section", "inhoud": "<p>HTML</p>" }]
    }]
  }]
}
```

### Excel/Text (Basic structure only)
- Only exports: category label/description, page title/description
- Does NOT preserve: intro, content, sections, urls
- Use JSON for full backup

## Import Field Mapping

| Internal | Also Accepts |
|----------|--------------|
| `label` | `categorie`, `category`, `naam`, `name` |
| `description` | `beschrijving`, `desc` |
| `pages` | `paginas`, `items` |
| `title` | `titel`, `naam`, `name` |
| `sections` | `secties` |
| `content` | `inhoud` |

## DnD Implementation (Sidebar.tsx)

```typescript
// Custom collision detection priority:
// 1. category-drop-zone (for cross-category page moves)
// 2. page in different category (cross-category)
// 3. page in same category (reordering)

// Data structure for sortable items:
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
App
├── Header (view mode toggle)
├── Toolbar (structure switch, export, import)
└── Content Area
    ├── [edit mode]
    │   ├── Sidebar (DndContext)
    │   │   └── CategoryItem (useSortable + useDroppable)
    │   │       └── PageItem (useSortable)
    │   └── MainContent
    │       ├── PageCard[]
    │       └── InlinePageEditor (slide-out panel)
    │           └── InlineSectionEditor[] (DndContext for sections)
    ├── [preview mode]
    │   └── PreviewLayout
    │       ├── PreviewSidebar
    │       └── PreviewMainContent / PreviewPageDetail
    └── [compare mode]
        └── CompareLayout (sync scroll)
            ├── CompareColumn (current)
            │   └── CompareCategoryItem → ComparePageItem
            └── CompareColumn (proposed)
                └── CompareCategoryItem → ComparePageItem
```

## Memory Leak Prevention

Components with timeouts/listeners must cleanup:

```typescript
// EditableText.tsx, TipTapInlineField.tsx
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);

// TipTapEditor.tsx
useEffect(() => {
  editor.on('selectionUpdate', update);
  return () => editor.off('selectionUpdate', update);
}, [editor]);
```

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

## Styling

Tailwind with Radboud brand tokens:

| Token | Color | Usage |
|-------|-------|-------|
| `ru-red-impact` | #e3000b | Primary actions, accents |
| `ru-maroon` | #730e04 | Text highlights, headers |
| `ru-berry` | #8f2011 | Hover states |
| `ru-blue` | #008acb | Links, current structure |
| `ru-green` | #4aa943 | Success, proposed structure |
| `ru-gray` | #797777 | Secondary text |
| `ru-light-gray` | #f5f5f5 | Backgrounds |
| `ru-border` | #e0e0e0 | Borders |
| `ru-text` | #333333 | Primary text |

## When Updating Scraped Data

1. Edit `src/features/navigation-editor/data/scraped-content.json`
2. Bump storage version: `const STORAGE_KEY = 'ru-nav-editor-state-vN'`
3. Run `npm run typecheck` to verify

## Tech Stack Quick Reference

| Package | Purpose |
|---------|---------|
| React 19 | UI framework |
| Zustand 5 + zundo | State management + undo/redo |
| Immer | Immutable state updates |
| @dnd-kit/* | Drag and drop |
| TipTap | Rich text editor |
| xlsx (SheetJS) | Excel export (dynamic import) |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |

# Single Comprehensive Prompt for Claude Code

Use this if you want to build the entire project in one go. Copy everything below the line.

---

Read the `claude.md` file in this directory for the complete project specification. Build the entire Radboud University Navigation Editor prototype following these steps:

## Phase 1: Project Initialization

1. **Create Vite project** with React + TypeScript + SWC template
2. **Install dependencies**:
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand immer xlsx zundo lucide-react
   npm install -D tailwindcss @tailwindcss/postcss postcss
   ```

3. **Configure Tailwind CSS v4**:
   - Create `postcss.config.js`:
     ```js
     export default {
       plugins: {
         '@tailwindcss/postcss': {}
       }
     }
     ```
   - Create `src/styles/globals.css` with all Radboud brand tokens from claude.md

4. **Add Open Sans font** to `index.html` from Google Fonts

5. **Configure path aliases** in `vite.config.ts` and `tsconfig.json`:
   - `@/*` → `src/*`
   - `@features/*` → `src/features/*`
   - `@components/*` → `src/components/*`

6. **Create folder structure** exactly as specified in claude.md

## Phase 2: Types, Data, and Utilities

Create these files with implementations from claude.md:

1. `src/features/navigation-editor/types/navigation.types.ts` - All TypeScript interfaces
2. `src/features/navigation-editor/data/initial-structure.ts` - Navigation data
3. `src/features/navigation-editor/utils/tree-helpers.ts` - Tree manipulation functions
4. `src/features/navigation-editor/utils/export-helpers.ts` - JSON/Excel export
5. Barrel `index.ts` files for each folder

## Phase 3: Zustand Store

Create `src/features/navigation-editor/hooks/useNavigationStore.ts`:

- Use Zustand with persist middleware (key: 'ru-nav-editor-state')
- Add temporal middleware from zundo for undo/redo (limit: 50)
- Implement all actions using Immer's produce:
  - CRUD: addCategory, addItem, updateLabel, deleteItem
  - Organization: moveItem, reorderCategories, toggleExpand
  - Selection: setSelected, setDragging
  - Persistence: reset, importStructure, exportToJson, exportToExcel

## Phase 4: UI Components

Create in `src/components/ui/`:
1. **Button.tsx** - variants: primary, secondary, ghost, danger; sizes: sm, md
2. **Input.tsx** - styled text input with focus states
3. **Modal.tsx** - overlay modal with portal, close on Escape/overlay click

Create in `src/features/navigation-editor/components/`:
1. **EditableText.tsx** - double-click to edit, Enter to save, Escape to cancel
2. **NavItem.tsx** - sortable item with drag handle, delete button on hover
3. **CategoryItem.tsx** - sortable category, collapsible, nested SortableContext for children
4. **Header.tsx** - logo placeholder, breadcrumb
5. **Sidebar.tsx** - "ICT" title, DndContext, categories list, add button
6. **MainContent.tsx** - selected item details or welcome message
7. **Toolbar.tsx** - export/import/reset/undo/redo buttons

## Phase 5: App Assembly

1. Create `src/features/navigation-editor/hooks/useDragAndDrop.ts`:
   - Handle dragStart, dragOver, dragEnd, dragCancel
   - Manage cross-category item moves

2. Update `src/app/App.tsx`:
   - Full viewport layout: Header top, Sidebar left, MainContent right
   - Wrap in DndContext with useDragAndDrop handlers
   - Add DragOverlay for drag preview
   - Add keyboard shortcuts (Ctrl+Z undo, Ctrl+Shift+Z redo)

3. Update `src/main.tsx`:
   - Import globals.css
   - Render App

## Phase 6: Polish

1. Delete confirmation modals for categories and items
2. Empty state messages for categories with no children
3. Loading state while hydrating from localStorage
4. Smooth CSS transitions (150ms) on all hover states
5. Proper aria-labels and focus styles for accessibility
6. Error handling for invalid JSON imports
7. Create README.md with setup and usage instructions

## Visual Requirements (Critical)

Match Radboud University styling exactly:
- **Colors**: Use `ru-*` tokens (red-impact: #e3000b, maroon: #730e04, berry: #8f2011)
- **Font**: Open Sans (bold 700 for titles, semibold 600 for categories, regular 400 for items)
- **"ICT" title**: 28px, bold, #e3000b with 3px red underline
- **Category text**: 16px, semibold, #730e04
- **Item text**: 15px, regular, #730e04, hover: underline + #8f2011
- **Sidebar**: 320px fixed width, 24px padding
- **Item indent**: 24px from category

## Verification Checklist

After building, test ALL of these:
- [ ] Categories reorder via drag
- [ ] Items reorder within same category
- [ ] Items move between categories via drag
- [ ] Double-click enables inline text editing
- [ ] Enter saves, Escape cancels editing
- [ ] Add category works
- [ ] Add item (on category hover) works
- [ ] Delete with confirmation works
- [ ] Expand/collapse categories works
- [ ] Export JSON downloads valid file
- [ ] Export Excel downloads valid file
- [ ] Import JSON replaces structure
- [ ] Reset restores initial data
- [ ] Ctrl+Z undoes, Ctrl+Shift+Z redoes
- [ ] State persists after refresh
- [ ] Styling matches Radboud brand

Build the complete project now, creating all files with working implementations. After each major phase, verify with `npm run dev` that there are no errors.

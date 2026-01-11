# Claude Code Initialization Prompt

Copy and paste this prompt into Claude Code to build the project:

---

## PROMPT 1: Project Setup

```
Read the claude.md file in this directory. This contains the complete project specification for a Radboud University navigation editor prototype.

First, set up the project:

1. Initialize a new Vite project with React, TypeScript, and SWC:
   - Project name: ru-nav-editor
   - Use the react-swc-ts template

2. Install all dependencies listed in claude.md:
   - Production: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, zustand, immer, xlsx, zundo, lucide-react
   - Dev: tailwindcss, @tailwindcss/postcss, postcss

3. Configure Tailwind CSS v4:
   - Create postcss.config.js with @tailwindcss/postcss
   - Create src/styles/globals.css with @import "tailwindcss" and the @theme block containing all Radboud brand tokens from claude.md
   - Import globals.css in main.tsx

4. Add Google Fonts (Open Sans) to index.html

5. Create the complete folder structure as specified in claude.md

6. Add path aliases to vite.config.ts:
   - @/* -> src/*
   - @features/* -> src/features/*
   - @components/* -> src/components/*

7. Update tsconfig.json with matching path aliases

After setup, verify with `npm run dev` that the project runs without errors.
```

---

## PROMPT 2: Core Types and Data

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Create the following files:

1. src/features/navigation-editor/types/navigation.types.ts
   - Copy the exact TypeScript interfaces from claude.md
   - Export all types

2. src/features/navigation-editor/data/initial-structure.ts
   - Copy the exact initialCategories data from claude.md
   - Export as named export

3. src/features/navigation-editor/utils/tree-helpers.ts
   - generateId(): string - generates unique IDs (use crypto.randomUUID or fallback)
   - findItemById(categories, id): NavItem | Category | null
   - findParentCategory(categories, itemId): Category | null
   - flattenTree(categories): Array<{id, label, depth, parentId}>

4. src/features/navigation-editor/utils/export-helpers.ts
   - exportToJson(categories): void - downloads .json file
   - exportToExcel(categories): void - downloads .xlsx file with columns: Level, Label, Parent
   - Create proper blob download handling

5. Create index.ts barrel exports for utils/ and types/

Verify types compile with `npm run typecheck` (add script if missing).
```

---

## PROMPT 3: Zustand Store

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Create the Zustand store in src/features/navigation-editor/hooks/useNavigationStore.ts:

1. Import dependencies: zustand, immer (produce), zundo (temporal), initial data

2. Create the store with:
   - State: categories, selectedId, isDragging (from NavigationState type)
   - All actions from NavigationActions type
   - Persist middleware with key 'ru-nav-editor-state'
   - Temporal middleware (zundo) for undo/redo with limit: 50

3. Implement all actions using Immer's produce for immutable updates:
   - addCategory: append new category with generated ID
   - addItem: find category, append item to children
   - updateLabel: find item/category by ID, update label
   - deleteItem: remove from parent's children or from root categories
   - moveItem: handle cross-category moves and same-category reorders
   - reorderCategories: swap positions in root array
   - toggleExpand: flip isExpanded boolean
   - setSelected, setDragging: simple setters
   - reset: replace with initialCategories
   - importStructure: validate and replace categories
   - exportToJson: return JSON.stringify(categories)
   - exportToExcel: call export helper

4. Export:
   - useNavigationStore hook
   - useTemporalStore for undo/redo access

5. Create index.ts barrel export for hooks/

Test by importing store in App.tsx and logging initial state.
```

---

## PROMPT 4: UI Primitives

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Create reusable UI components in src/components/ui/:

1. Button.tsx
   - Props: variant ('primary' | 'secondary' | 'ghost' | 'danger'), size ('sm' | 'md'), disabled, children, onClick, className
   - Use Tailwind classes with ru-* color tokens
   - Primary: bg-ru-red-impact, hover:bg-ru-berry, white text
   - Ghost: transparent, hover:bg-ru-light-gray
   - Danger: text-ru-red-impact, hover:bg-red-50

2. Input.tsx
   - Props: value, onChange, placeholder, className, autoFocus, onKeyDown
   - Styled with border, focus ring using ru-red-impact
   
3. Modal.tsx
   - Props: isOpen, onClose, title, children, actions (ReactNode)
   - Overlay with backdrop blur
   - Centered white card with shadow
   - Close on Escape key and overlay click
   - Use createPortal to render in document.body

4. Create index.ts with named exports for all components

Use forwardRef where appropriate for Input.
```

---

## PROMPT 5: Editor Components

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Create the editor components in src/features/navigation-editor/components/:

1. EditableText.tsx
   - Props: value, onSave, className, placeholder
   - Display mode: shows text, double-click to edit
   - Edit mode: input field, auto-focus, select all
   - Enter to save (if not empty), Escape to cancel
   - Use local state for editing mode and draft value

2. NavItem.tsx
   - Props: item (NavItem type), onSelect, isSelected
   - Use @dnd-kit useSortable hook
   - Show drag handle (GripVertical icon) on hover
   - Show delete button (X icon) on hover
   - Use EditableText for label
   - Apply transform and transition from useSortable
   - Style: indented, ru-maroon text, hover underline

3. CategoryItem.tsx
   - Props: category (Category type), onSelect, selectedId
   - Use @dnd-kit useSortable for the category itself
   - Collapsible: ChevronRight/ChevronDown icon, click to toggle
   - Show drag handle on hover
   - Show add item button (+) on hover
   - Show delete button on hover
   - Use EditableText for category label
   - Render children NavItems in nested SortableContext
   - Use @dnd-kit useDroppable for the children container

4. Create index.ts barrel export

Make sure all DnD hooks use proper id and data attributes.
```

---

## PROMPT 6: Layout Components

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Create layout components:

1. src/features/navigation-editor/components/Header.tsx
   - Fixed height (64px), white background, bottom border
   - Left: Radboud logo placeholder (red rectangle 180x40 with "Radboud Universiteit" text in white)
   - Right: NL | EN language toggle (decorative, no functionality)
   - Below logo: Breadcrumb "Home > Services > Campusfaciliteiten & gebouwen > ICT"
   - Use ru-* colors, proper spacing

2. src/features/navigation-editor/components/Sidebar.tsx
   - Fixed width (320px from CSS variable), full height minus header
   - White background, right border
   - Padding: 24px
   - "ICT" title: 28px, bold, ru-red-impact, with 3px red underline (40px wide)
   - Subtitle: "Alles over ICT: wifi, VPN, wachtwoorden, printen, software, en meer."
   - DndContext wrapper with sensors (pointer, keyboard)
   - SortableContext for categories
   - Map categories to CategoryItem components
   - "Add category" button at bottom

3. src/features/navigation-editor/components/MainContent.tsx
   - Fills remaining space
   - Light gray background (ru-light-gray)
   - If no selection: Welcome message with usage instructions
   - If selected: Show item label, path, edit hints
   - Include keyboard shortcut reference

4. src/features/navigation-editor/components/Toolbar.tsx
   - Fixed position bottom or top of sidebar
   - Row of buttons: Export JSON, Export Excel, Import, Reset
   - Undo/Redo buttons with disabled states
   - Use temporal store for undo/redo handlers
   - Confirmation modal for Reset

Update component index.ts with all exports.
```

---

## PROMPT 7: App Assembly and DnD Logic

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

1. Create src/features/navigation-editor/hooks/useDragAndDrop.ts
   - Custom hook that handles all DnD events
   - handleDragStart: set isDragging true, track active item
   - handleDragOver: determine if moving within or between categories
   - handleDragEnd: call appropriate store action (reorderCategories or moveItem)
   - handleDragCancel: reset dragging state
   - Return: handlers object, activeId, overId

2. Update src/app/App.tsx
   - Import all components
   - Layout: flex container, full viewport height
   - Header at top (full width)
   - Below header: flex row with Sidebar and MainContent
   - Wrap everything in DndContext from useDragAndDrop hook
   - Add DragOverlay for smooth drag preview

3. Create src/app/providers.tsx (if needed for future context)
   - Simple wrapper, can just return children for now

4. Update src/main.tsx
   - Import globals.css
   - Render App with StrictMode

5. Add keyboard shortcuts:
   - Listen for Ctrl+Z / Cmd+Z -> undo
   - Listen for Ctrl+Shift+Z / Cmd+Shift+Z -> redo
   - Add useEffect in App.tsx with keyboard event listener

Run `npm run dev` and test:
- All categories render
- Categories can be dragged and reordered
- Items within categories can be reordered
- Test cross-category item moves
```

---

## PROMPT 8: Polish and Final Testing

```
Continue building the ru-nav-editor project. Reference claude.md for specifications.

Final polish:

1. Add loading state handling:
   - Show brief loading indicator while store hydrates from localStorage

2. Add delete confirmation:
   - Use Modal component for delete confirmations
   - Different message for category (warns about children) vs item

3. Add empty state for categories with no items:
   - Show "No items yet. Click + to add." message
   - Style with lighter text

4. Visual polish:
   - Smooth transitions on hover states (150ms)
   - Drag overlay should show the item being dragged with slight shadow
   - Active drop zone should have dashed border and light background
   - Selected item should have left border indicator (ru-red-impact)

5. Accessibility:
   - Proper aria-labels on all buttons
   - Focus visible styles
   - Announce drag operations to screen readers

6. Error handling:
   - Import JSON: validate structure, show error toast if invalid
   - Graceful fallback if localStorage is unavailable

7. Update README.md with:
   - Project description
   - Setup instructions
   - Usage guide
   - Keyboard shortcuts

Run through the complete verification checklist from claude.md and fix any issues.
```

---

## Quick Test Commands

After each prompt, test with:

```bash
# Start dev server
npm run dev

# Type check (ensure no TS errors)
npm run typecheck

# Build (ensure production build works)
npm run build
```

---

## Troubleshooting Tips for Claude Code

If you encounter issues:

1. **Module not found**: Check import paths match the alias config
2. **Type errors**: Ensure all interfaces are exported and imported correctly
3. **DnD not working**: Verify DndContext wraps all draggable content
4. **Styles not applying**: Confirm globals.css is imported in main.tsx
5. **State not persisting**: Check localStorage permissions in browser

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  CollisionDetection,
  MeasuringStrategy,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Plus, FileText, X, Check, List, Columns3, Search } from 'lucide-react';
import { useNavigationStore } from '../hooks';
import CategoryItem from './CategoryItem';

// Drop animation configuration for smooth transitions
const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

// Measuring configuration — frequency forces periodic rect re-measurement during drag
// so that droppableRects reflect CSS transforms applied by the sorting strategy.
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
    frequency: 100,
  },
};

export default function Sidebar() {
  const {
    categories,
    addCategory,
    reorderCategories,
    movePageToCategory,
    reorderPages,
    setDragging,
    isReadOnly,
    layoutMode,
    setLayoutMode,
  } = useNavigationStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'category' | 'page' | null>(null);
  // Track the current category of the dragged page (may change during cross-category drags)
  const [activeDragCategoryId, setActiveDragCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Hysteresis: last category target during a category drag.
  // When the pointer is in the gap left by a shifted item (no direct rect hit),
  // we hold this target instead of firing closestCenter, which would pick the
  // wrong neighbour. Cleared on drag start/end/cancel.
  const lastCategoryOver = useRef<string | number | null>(null);

  // Hover delay for category-drop-zone: only move a page into a closed category
  // after the pointer has rested there for 400ms. This lets the user drag through
  // closed categories (pass-through) without accidentally dropping into them.
  const pendingCategoryDropRef = useRef<{
    targetCategoryId: string;
    fromCategoryId: string;
    pageId: string;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  // Filter categories and pages based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase().trim();
    return categories
      .map((category) => {
        // Check if category label matches
        const categoryMatches = category.label.toLowerCase().includes(query);
        // Filter pages that match
        const matchingPages = category.pages?.filter(
          (page) =>
            page.title.toLowerCase().includes(query) ||
            page.description?.toLowerCase().includes(query)
        );

        // Include category if its label matches OR it has matching pages
        if (categoryMatches || (matchingPages && matchingPages.length > 0)) {
          return {
            ...category,
            // If category matches, show all pages; otherwise show only matching pages
            pages: categoryMatches ? category.pages : matchingPages,
            // Auto-expand categories with matches when searching
            isExpanded: true,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof categories;
  }, [categories, searchQuery]);

  // Focus input when adding category
  useEffect(() => {
    if (isAddingCategory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingCategory]);

  // Keyboard navigation for sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when sidebar has focus or no specific element is focused
      const activeElement = document.activeElement;
      const isInSidebar = activeElement?.closest('aside');
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (isInput || !isInSidebar) return;

      const { selectedId, setSelected, toggleExpand } = useNavigationStore.getState();
      const currentIndex = categories.findIndex((c) => c.id === selectedId);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < categories.length - 1) {
            setSelected(categories[currentIndex + 1].id);
          } else if (currentIndex === -1 && categories.length > 0) {
            setSelected(categories[0].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelected(categories[currentIndex - 1].id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (selectedId) {
            const category = categories.find((c) => c.id === selectedId);
            if (category && !category.isExpanded && category.pages?.length) {
              toggleExpand(selectedId);
            }
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (selectedId) {
            const category = categories.find((c) => c.id === selectedId);
            if (category?.isExpanded) {
              toggleExpand(selectedId);
            }
          }
          break;
        case 'Home':
          e.preventDefault();
          if (categories.length > 0) {
            setSelected(categories[0].id);
          }
          break;
        case 'End':
          e.preventDefault();
          if (categories.length > 0) {
            setSelected(categories[categories.length - 1].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [categories]);

  // Custom collision detection.
  //
  // For CATEGORY drags we use a pointer-in-rect approach with hysteresis:
  //   1. Direct hit: pointer inside a category's rect → swap to that category.
  //   2. No direct hit (pointer in the gap left by a just-shifted item) → hold
  //      the previous target (lastCategoryOver). This prevents closestCenter from
  //      picking the wrong neighbour when rects are momentarily stale after a swap.
  //   3. No previous target (drag just started) → closestCenter fallback.
  //   frequency:100 on the measuring config re-measures rects every ~100ms so
  //   fresh rect positions (post-CSS-transform) are available quickly.
  //
  // For PAGE drags we use composite pointer+rect collision with priority ordering.
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    try {
      const getContainerData = (id: string | number) => {
        const container = args.droppableContainers.find((cont) => cont.id === id);
        return container?.data?.current;
      };
      const activeData = args.active.data.current;
      const isDraggingPage = activeData?.type === 'page';
      const sourceCategoryId = activeData?.categoryId;

      if (!isDraggingPage) {
        const categoryContainers = args.droppableContainers.filter(
          (cont) => cont.data?.current?.type === 'category' && cont.id !== args.active.id
        );

        const pointerY = args.pointerCoordinates?.y;

        if (pointerY != null) {
          // 1. Direct hit: pointer is inside this category's measured rect.
          for (const container of categoryContainers) {
            const rect = args.droppableRects.get(container.id);
            if (!rect) continue;
            if (pointerY >= rect.top && pointerY <= rect.bottom) {
              lastCategoryOver.current = container.id;
              return [{ id: container.id, data: { value: 0 } }];
            }
          }

          // 2. No direct hit — pointer is in the gap left by a shifted item.
          //    Hold the last swap target (hysteresis) until the pointer enters a
          //    new rect. This prevents oscillation / wrong-neighbour selection.
          if (lastCategoryOver.current != null) {
            return [{ id: lastCategoryOver.current, data: { value: 0 } }];
          }
        }

        // 3. Keyboard nav or first frame: fall back to closestCenter.
        return closestCenter({ ...args, droppableContainers: categoryContainers });
      }

      // --- Page dragging: composite collision with priority ---
      const pointerCollisions = pointerWithin(args);
      const rectCollisions = rectIntersection(args);

      const allCollisions = [...pointerCollisions];
      rectCollisions.forEach((c) => {
        if (!allCollisions.find((p) => p.id === c.id)) allCollisions.push(c);
      });

      const filteredCollisions = allCollisions.filter((c) => c.id !== args.active.id);

      const categoryDropZone = filteredCollisions.find((c) => getContainerData(c.id)?.type === 'category-drop-zone');
      if (categoryDropZone) return [categoryDropZone];

      const crossCategoryPage = filteredCollisions.find((c) => {
        const data = getContainerData(c.id);
        return data?.type === 'page' && data.categoryId && data.categoryId !== sourceCategoryId;
      });
      if (crossCategoryPage) return [crossCategoryPage];

      const samePageCollision = filteredCollisions.find((c) => getContainerData(c.id)?.type === 'page');
      if (samePageCollision) return [samePageCollision];

      return [];
    } catch {
      return [];
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddCategory = () => {
    setIsAddingCategory(true);
  };

  const handleSubmitCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleCancelCategory = () => {
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitCategory();
    } else if (e.key === 'Escape') {
      handleCancelCategory();
    }
  };

  // Category IDs for the top-level sortable context (use filtered when searching)
  const categoryIds = useMemo(
    () => filteredCategories.map((c) => c.id),
    [filteredCategories]
  );

  // Disable DnD when search is active — the filtered view is a subset of
  // the full store, so drag operations could target non-visible categories
  const isDndDisabled = isReadOnly || !!searchQuery.trim();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (isDndDisabled) return;

    const { active } = event;
    const data = active.data.current;

    setActiveId(active.id as string);
    setActiveType(data?.type || null);
    setActiveDragCategoryId(data?.categoryId || null);
    setDragging(true);
    lastCategoryOver.current = null;
    if (pendingCategoryDropRef.current) {
      clearTimeout(pendingCategoryDropRef.current.timer);
      pendingCategoryDropRef.current = null;
    }
  }, [setDragging, isDndDisabled]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    try {
      const { active, over } = event;

      if (!over) {
        // Pointer left all droppables — cancel any pending category drop
        if (pendingCategoryDropRef.current) {
          clearTimeout(pendingCategoryDropRef.current.timer);
          pendingCategoryDropRef.current = null;
        }
        return;
      }

      const activeData = active.data.current;
      const overData = over.data.current;

      // Only handle page moves
      if (activeData?.type !== 'page') return;

      // Use tracked categoryId from state (not from dnd-kit data to avoid mutation)
      const sourceCategoryId = activeDragCategoryId;
      if (!sourceCategoryId) return;

      let targetCategoryId: string | null = null;

      // Determine target category
      if (overData?.type === 'category') {
        targetCategoryId = over.id as string;
      } else if (overData?.type === 'page') {
        targetCategoryId = overData.categoryId;
      } else if (overData?.type === 'category-drop-zone') {
        targetCategoryId = overData.categoryId;
      }

      if (targetCategoryId && sourceCategoryId !== targetCategoryId) {
        const isCategoryDropZone = overData?.type === 'category-drop-zone';

        if (isCategoryDropZone) {
          // Hovering over a closed category header: delay the move so the user can
          // pass through intermediate categories without accidentally dropping into them.
          // If already pending for this exact target, just wait for the timer.
          if (pendingCategoryDropRef.current?.targetCategoryId === targetCategoryId) return;

          // New target — cancel the previous pending drop and schedule a new one.
          if (pendingCategoryDropRef.current) {
            clearTimeout(pendingCategoryDropRef.current.timer);
            pendingCategoryDropRef.current = null;
          }

          const fromCategoryId = sourceCategoryId;
          const pageId = active.id as string;
          const resolvedTargetId = targetCategoryId;

          const timer = setTimeout(() => {
            const state = useNavigationStore.getState();
            const cats = state.structures[state.activeStructure];
            const fromCat = cats.find(c => c.id === fromCategoryId);
            const toCat = cats.find(c => c.id === resolvedTargetId);
            const pageExists = fromCat?.pages?.some(p => p.id === pageId);

            if (fromCat && toCat && pageExists) {
              movePageToCategory(fromCategoryId, resolvedTargetId, pageId);
              setActiveDragCategoryId(resolvedTargetId);
            }
            pendingCategoryDropRef.current = null;
          }, 400);

          pendingCategoryDropRef.current = { targetCategoryId, fromCategoryId, pageId, timer };
          return;
        }

        // Dragging over a page in another category — move immediately and cancel any
        // pending category drop (user clearly moved to a more specific target).
        if (pendingCategoryDropRef.current) {
          clearTimeout(pendingCategoryDropRef.current.timer);
          pendingCategoryDropRef.current = null;
        }

        const state = useNavigationStore.getState();
        const cats = state.structures[state.activeStructure];
        const fromCat = cats.find(c => c.id === sourceCategoryId);
        const toCat = cats.find(c => c.id === targetCategoryId);
        const pageExists = fromCat?.pages?.some(p => p.id === (active.id as string));

        if (fromCat && toCat && pageExists) {
          movePageToCategory(sourceCategoryId, targetCategoryId, active.id as string);
          setActiveDragCategoryId(targetCategoryId);
        }
      } else {
        // Still in source category or no target — cancel any pending drop.
        if (pendingCategoryDropRef.current) {
          clearTimeout(pendingCategoryDropRef.current.timer);
          pendingCategoryDropRef.current = null;
        }
      }
    } catch (e) {
      console.error('[DnD] dragOver error:', e);
      setActiveDragCategoryId(null);
      if (pendingCategoryDropRef.current) {
        clearTimeout(pendingCategoryDropRef.current.timer);
        pendingCategoryDropRef.current = null;
      }
    }
  }, [movePageToCategory, activeDragCategoryId]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    setActiveType(null);
    setActiveDragCategoryId(null);
    setDragging(false);
    lastCategoryOver.current = null;
    if (pendingCategoryDropRef.current) {
      clearTimeout(pendingCategoryDropRef.current.timer);
      pendingCategoryDropRef.current = null;
    }

    try {
      const { active, over } = event;

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Category reordering
      if (activeData?.type === 'category' && overData?.type === 'category') {
        if (active.id !== over.id) {
          reorderCategories(active.id as string, over.id as string);
        }
        return;
      }

      // Page reordering within same category
      if (activeData?.type === 'page' && overData?.type === 'page') {
        const sourceCategoryId = activeData.categoryId;
        const targetCategoryId = overData.categoryId;

        if (sourceCategoryId === targetCategoryId && active.id !== over.id) {
          reorderPages(sourceCategoryId, active.id as string, over.id as string);
        }
      }
    } catch (e) {
      console.error('[DnD] dragEnd error:', e);
    }
  }, [reorderCategories, reorderPages, setDragging]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    setActiveDragCategoryId(null);
    setDragging(false);
    lastCategoryOver.current = null;
    if (pendingCategoryDropRef.current) {
      clearTimeout(pendingCategoryDropRef.current.timer);
      pendingCategoryDropRef.current = null;
    }
  }, [setDragging]);

  // Find active category for drag overlay
  const activeCategory = activeId && activeType === 'category'
    ? categories.find((c) => c.id === activeId)
    : null;

  // Find active page for drag overlay
  const activePage = useMemo(() => {
    if (!activeId || activeType !== 'page') return null;
    for (const cat of categories) {
      const page = cat.pages?.find((p) => p.id === activeId);
      if (page) return page;
    }
    return null;
  }, [activeId, activeType, categories]);

  return (
    <aside
      className="w-[420px] h-full bg-white border-r-2 border-ru-border shadow-sm flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ru-red-impact/30"
      tabIndex={0}
      role="tree"
      aria-label="Navigatiestructuur"
    >
      {/* Title */}
      <div className="px-6 pt-8 pb-4 bg-gradient-to-b from-ru-light-gray/50 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ru-red-impact tracking-tight">ICT</h1>
            <p className="text-sm text-ru-text-light mt-1">Navigatiestructuur</p>
          </div>
          {/* Layout Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-2 rounded-lg transition-all ${
                layoutMode === 'list'
                  ? 'bg-ru-light-gray text-ru-red-impact shadow-sm'
                  : 'text-ru-gray hover:text-ru-red-impact hover:bg-ru-light-gray/50'
              }`}
              title="Lijstweergave"
              aria-label="Lijstweergave"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setLayoutMode('columns')}
              className={`p-2 rounded-lg transition-all ${
                layoutMode === 'columns'
                  ? 'bg-ru-light-gray text-ru-red-impact shadow-sm'
                  : 'text-ru-gray hover:text-ru-red-impact hover:bg-ru-light-gray/50'
              }`}
              title="Kolommenweergave"
              aria-label="Kolommenweergave"
            >
              <Columns3 size={18} />
            </button>
          </div>
        </div>
        <div className="w-20 h-1 bg-ru-red-impact mt-3 rounded-full" />

        {/* Search box */}
        <div className="relative mt-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ru-gray"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoeken in categorieën en pagina's..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-ru-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ru-red-impact/30 focus:border-ru-red-impact bg-white"
            aria-label="Zoeken in navigatie"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ru-gray hover:text-ru-text rounded"
              aria-label="Zoekopdracht wissen"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-ru-text-light mt-2">
            {filteredCategories.length === 0
              ? 'Geen resultaten gevonden'
              : `${filteredCategories.reduce((acc, cat) => acc + (cat.pages?.length || 0), 0)} pagina's in ${filteredCategories.length} ${filteredCategories.length === 1 ? 'categorie' : 'categorieën'}`}
          </p>
        )}
      </div>

      {/* Navigation tree */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-5 pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          measuring={measuringConfig}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={categoryIds}
            strategy={verticalListSortingStrategy}
          >
            {filteredCategories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                isReadOnly={isDndDisabled}
              />
            ))}
          </SortableContext>

          {/* Drag overlay with smooth drop animation */}
          <DragOverlay dropAnimation={dropAnimation}>
            {activeCategory && (
              <div className="bg-white shadow-xl rounded-lg py-2 px-3 border-2 border-ru-red-impact cursor-grabbing">
                <span className="font-semibold text-base text-ru-maroon">
                  {activeCategory.label}
                </span>
              </div>
            )}
            {activePage && (
              <div className="bg-white shadow-xl rounded-lg py-1.5 px-3 border-2 border-ru-red-impact cursor-grabbing flex items-center gap-2">
                <FileText size={14} className="text-ru-red-impact flex-shrink-0" />
                <span className="text-sm text-ru-text truncate">
                  {activePage.title}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add category button/input - hidden in read-only mode */}
      {!isReadOnly && (
        <div className="px-5 py-4 border-t border-ru-border bg-ru-light-gray/30">
          {isAddingCategory ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Naam categorie..."
                className="flex-1 px-4 py-2.5 text-sm border border-ru-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ru-red-impact/30 focus:border-ru-red-impact bg-white"
              />
              <button
                onClick={handleSubmitCategory}
                disabled={!newCategoryName.trim()}
                className="p-2.5 text-ru-green hover:bg-ru-green/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Bevestigen"
              >
                <Check size={20} />
              </button>
              <button
                onClick={handleCancelCategory}
                className="p-2.5 text-ru-gray hover:bg-ru-light-gray rounded-lg transition-colors"
                aria-label="Annuleren"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-ru-maroon hover:text-white border border-ru-red-impact/30 rounded-lg hover:border-ru-red-impact hover:bg-ru-red-impact transition-all duration-150"
            >
              <Plus size={18} />
              Nieuwe categorie
            </button>
          )}
        </div>
      )}

      {/* Read-only indicator */}
      {isReadOnly && (
        <div className="px-5 py-4 border-t border-ru-border bg-ru-blue/10 border-l-4 border-l-ru-blue">
          <p className="text-sm text-ru-text-light">
            Dit is de originele ru.nl structuur (alleen lezen)
          </p>
        </div>
      )}
    </aside>
  );
}

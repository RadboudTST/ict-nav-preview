import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
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
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Plus, FileText, X, Check, List, Columns3 } from 'lucide-react';
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

// Measuring configuration for better accuracy during cross-container moves
const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
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
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Custom collision detection that prioritizes category drop zones when dragging pages
  // Uses data.type instead of ID prefixes for reliability with dynamic IDs
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Helper to get container data by ID
    const getContainerData = (id: string | number) => {
      const container = args.droppableContainers.find((cont) => cont.id === id);
      return container?.data?.current;
    };
    const activeData = args.active.data.current;
    const isDraggingPage = activeData?.type === 'page';
    const sourceCategoryId = activeData?.categoryId;

    // Get all collisions using both algorithms
    const pointerCollisions = pointerWithin(args);
    const rectCollisions = rectIntersection(args);

    // Combine and deduplicate
    const allCollisions = [...pointerCollisions];
    rectCollisions.forEach((c) => {
      if (!allCollisions.find((p) => p.id === c.id)) {
        allCollisions.push(c);
      }
    });

    // Filter out the active item itself
    const filteredCollisions = allCollisions.filter(
      (collision) => collision.id !== args.active.id
    );

    if (isDraggingPage) {
      // When dragging a page, prioritize category drop zones
      const categoryDropZone = filteredCollisions.find((c) => {
        const data = getContainerData(c.id);
        return data?.type === 'category-drop-zone';
      });

      if (categoryDropZone) {
        return [categoryDropZone];
      }

      // Check for pages in a DIFFERENT category (for cross-category moves)
      const crossCategoryPage = filteredCollisions.find((c) => {
        const data = getContainerData(c.id);
        if (data?.type !== 'page') return false;
        return data.categoryId && data.categoryId !== sourceCategoryId;
      });

      if (crossCategoryPage) {
        return [crossCategoryPage];
      }

      // Fallback to pages in same category for reordering
      const samePageCollision = filteredCollisions.find((c) => {
        const data = getContainerData(c.id);
        return data?.type === 'page';
      });

      if (samePageCollision) {
        return [samePageCollision];
      }

      return [];
    }

    // When dragging a category, only allow category-to-category reordering
    const categoryCollisions = filteredCollisions.filter((c) => {
      const data = getContainerData(c.id);
      return data?.type === 'category';
    });

    return categoryCollisions;
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

  // Category IDs for the top-level sortable context
  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    // Disable drag in read-only mode
    if (isReadOnly) return;

    const { active } = event;
    const data = active.data.current;

    setActiveId(active.id as string);
    setActiveType(data?.type || null);
    setDragging(true);
  }, [setDragging, isReadOnly]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle page moves
    if (activeData?.type !== 'page') return;

    const sourceCategoryId = activeData.categoryId;
    let targetCategoryId: string | null = null;

    // Determine target category
    if (overData?.type === 'category') {
      targetCategoryId = over.id as string;
    } else if (overData?.type === 'page') {
      targetCategoryId = overData.categoryId;
    } else if (overData?.type === 'category-drop-zone') {
      targetCategoryId = overData.categoryId;
    }

    // Move page to new category during drag (real-time feedback)
    if (targetCategoryId && sourceCategoryId !== targetCategoryId) {
      movePageToCategory(sourceCategoryId, targetCategoryId, active.id as string);
      // Update the active data's categoryId reference
      if (active.data.current) {
        active.data.current.categoryId = targetCategoryId;
      }
    }
  }, [movePageToCategory]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveType(null);
    setDragging(false);

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
  }, [reorderCategories, reorderPages, setDragging]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
    setDragging(false);
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
      <div className="px-6 pt-8 pb-6 bg-gradient-to-b from-ru-light-gray/50 to-transparent">
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
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={categoryIds}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category) => (
              <CategoryItem key={category.id} category={category} isReadOnly={isReadOnly} />
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

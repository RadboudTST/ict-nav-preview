import { useState, useMemo } from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy, defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronDown, ChevronRight, X } from 'lucide-react';
import { Category } from '../types/navigation.types';
import { useNavigationStore } from '../hooks';
import { confirm } from '@/components/ui';
import EditableText from './EditableText';
import PageItem from './PageItem';

// Custom animation that skips initial animation but animates during sorting
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  // Skip animation on initial render, animate during/after sorting
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return false;
};

interface CategoryItemProps {
  category: Category;
  isReadOnly?: boolean;
}

export default function CategoryItem({ category, isReadOnly = false }: CategoryItemProps) {
  const { toggleExpand, updateLabel, updateCategoryDescription, deleteItem, selectedId, setSelected, clearSelectedPage } = useNavigationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Make category sortable (for reordering categories)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
      category,
    },
    animateLayoutChanges,
    disabled: isReadOnly,
  });

  // Make category droppable (for receiving pages)
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${category.id}`,
    data: {
      type: 'category-drop-zone',
      categoryId: category.id,
    },
    disabled: isReadOnly,
  });

  // Note: We separate the refs - sortable on container, droppable on header only
  // This prevents the droppable zone from covering all pages inside the category

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  const handleToggle = () => {
    toggleExpand(category.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const pageCount = category.pages?.length || 0;

    let message = `Weet je zeker dat je "${category.label}" wilt verwijderen?`;
    if (pageCount > 0) {
      message = `Weet je zeker dat je "${category.label}" en alle ${pageCount} pagina${pageCount > 1 ? "'s" : ''} wilt verwijderen?`;
    }

    const confirmed = await confirm({
      title: 'Categorie verwijderen',
      message,
      confirmLabel: 'Verwijderen',
      variant: pageCount > 0 ? 'danger' : 'warning',
    });

    if (confirmed) {
      deleteItem(category.id);
    }
  };

  const handleSave = (newLabel: string) => {
    updateLabel(category.id, newLabel);
    setIsEditing(false);
  };

  const handleSaveDescription = (newDescription: string) => {
    updateCategoryDescription(category.id, newDescription);
    setIsEditingDescription(false);
  };

  const isSelected = selectedId === category.id;
  const hasPages = category.pages && category.pages.length > 0;

  // Page IDs for this category's SortableContext
  const pageIds = useMemo(
    () => category.pages?.map((p) => p.id) || [],
    [category.pages]
  );

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`mb-1.5 ${isDragging ? 'opacity-50 z-50' : ''}`}
    >
      {/* Category header - this is the droppable zone for receiving pages */}
      <div
        ref={setDroppableRef}
        {...(isReadOnly ? {} : { ...attributes, ...listeners })}
        className={`group relative flex items-center gap-3 py-3 px-3 rounded-lg transition-colors ${
          isSelected ? 'bg-ru-light-gray shadow-sm' : 'hover:bg-ru-light-gray/50'
        } ${isOver ? 'ring-2 ring-ru-red-impact ring-offset-1 bg-ru-red-impact/5' : ''} ${
          isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
        }`}
        onClick={() => {
          clearSelectedPage();
          setSelected(category.id);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag handle indicator - shows on hover in edit mode */}
        {!isReadOnly && (
          <div
            className={`drag-handle absolute -left-6 top-1/2 -translate-y-1/2 p-0.5 rounded transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <GripVertical size={18} className="text-ru-gray" />
          </div>
        )}

        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className={`flex-shrink-0 p-1 rounded hover:bg-ru-border transition-colors ${hasPages ? '' : 'invisible'}`}
          aria-label={category.isExpanded ? 'Inklappen' : 'Uitklappen'}
        >
          {category.isExpanded ? (
            <ChevronDown size={18} className="text-ru-gray" />
          ) : (
            <ChevronRight size={18} className="text-ru-gray" />
          )}
        </button>

        {/* Label and description */}
        <div className="flex-1 min-w-0">
          <EditableText
            value={category.label}
            onSave={handleSave}
            isEditing={isEditing}
            onEditStart={() => setIsEditing(true)}
            onEditEnd={() => setIsEditing(false)}
            className="text-[15px] font-semibold text-ru-maroon truncate block leading-snug"
            disabled={isReadOnly}
          />
          {(category.description || !isReadOnly) && (
            <EditableText
              value={category.description || ''}
              onSave={handleSaveDescription}
              isEditing={isEditingDescription}
              onEditStart={() => setIsEditingDescription(true)}
              onEditEnd={() => setIsEditingDescription(false)}
              className="text-sm text-ru-text-light mt-0.5 truncate block"
              placeholder="Beschrijving toevoegen..."
              disabled={isReadOnly}
              allowEmpty
            />
          )}
        </div>

        {/* Page count badge */}
        {hasPages && (
          <span className="flex-shrink-0 text-xs font-medium text-ru-text-light bg-ru-light-gray px-2.5 py-1 rounded-full">
            {category.pages!.length} {category.pages!.length === 1 ? 'pagina' : "pagina's"}
          </span>
        )}

        {/* Delete button - absolutely positioned, shows on hover in edit mode */}
        {!isReadOnly && (
          <button
            onClick={handleDelete}
            className={`absolute -right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-ru-red-impact/10 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            aria-label="Verwijder categorie"
          >
            <X size={16} className="text-ru-gray hover:text-ru-red-impact" />
          </button>
        )}
      </div>

      {/* Pages - each category has its own SortableContext */}
      {category.isExpanded && hasPages && (
        <div className="ml-12 mt-1.5 space-y-1 border-l-2 border-ru-border/50 pl-3">
          <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
            {category.pages!.map((page) => (
              <PageItem key={page.id} page={page} categoryId={category.id} isReadOnly={isReadOnly} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

import { useSortable, defaultAnimateLayoutChanges, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText } from 'lucide-react';
import { PageItem as PageItemType } from '../types/navigation.types';
import { useNavigationStore } from '../hooks';

// Custom animation that skips initial animation but animates during sorting
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return false;
};

interface PageItemProps {
  page: PageItemType;
  categoryId: string;
  isReadOnly?: boolean;
}

export default function PageItem({ page, categoryId, isReadOnly = false }: PageItemProps) {
  const { setSelected, selectPage, selectedPageId } = useNavigationStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: page.id,
    data: {
      type: 'page',
      page,
      categoryId,
    },
    animateLayoutChanges,
    disabled: isReadOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  const isPageSelected = selectedPageId === page.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isReadOnly ? {} : { ...attributes, ...listeners })}
      className={`group relative flex items-center gap-2.5 py-2 px-3 text-sm rounded-lg transition-colors ${
        isPageSelected
          ? 'bg-ru-red-impact/10 text-ru-red-impact font-medium'
          : 'text-ru-text hover:bg-ru-light-gray/70'
      } ${isDragging ? 'opacity-50 z-50' : ''} ${
        isReadOnly ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setSelected(categoryId);
        selectPage(categoryId, page.id);
      }}
    >
      {/* Drag handle indicator - shows on hover in edit mode */}
      {!isReadOnly && (
        <div className="drag-handle absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={14} className="text-ru-gray" />
        </div>
      )}

      <FileText
        size={16}
        className={`flex-shrink-0 ${isPageSelected ? 'text-ru-red-impact' : 'text-ru-gray'}`}
      />
      <span className="truncate leading-snug">{page.title}</span>
    </div>
  );
}

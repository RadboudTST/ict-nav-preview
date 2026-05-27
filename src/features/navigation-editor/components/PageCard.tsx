import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, ArrowRight, ExternalLink } from 'lucide-react';
import { PageItem } from '../types/navigation.types';
import { useNavigationStore } from '../hooks';
import { confirm } from '@/components/ui';

interface PageCardProps {
  page: PageItem;
  parentId: string;
  onDelete: (pageId: string) => void;
  isReadOnly?: boolean;
}

export default function PageCard({ page, parentId, onDelete, isReadOnly = false }: PageCardProps) {
  const { selectPage } = useNavigationStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    data: {
      type: 'page',
      parentId,
    },
    disabled: isReadOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking on drag handle or delete button
    const target = e.target as HTMLElement;
    if (target.closest('[data-drag-handle]') || target.closest('[data-delete-btn]')) {
      return;
    }
    selectPage(parentId, page.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Pagina verwijderen',
      message: `Weet je zeker dat je "${page.title}" wilt verwijderen?`,
      confirmLabel: 'Verwijderen',
      variant: 'danger',
    });
    if (confirmed) {
      onDelete(page.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={`
        group relative bg-white rounded-lg border border-ru-border p-4
        hover:border-ru-red-impact/40 hover:shadow-md
        focus-within:ring-2 focus-within:ring-ru-red-impact/30
        transition-all duration-150 cursor-pointer
        ${isDragging ? 'opacity-50 shadow-lg scale-[1.02]' : ''}
      `}
    >
      {/* Drag handle - hidden in read-only mode */}
      {!isReadOnly && (
        <button
          {...attributes}
          {...listeners}
          data-drag-handle
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-ru-gray hover:text-ru-text transition-opacity"
          aria-label="Sleep om te verplaatsen"
        >
          <GripVertical size={16} />
        </button>
      )}

      {/* Delete button - hidden in read-only mode */}
      {!isReadOnly && (
        <button
          onClick={handleDelete}
          data-delete-btn
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-ru-light-gray text-ru-gray hover:text-ru-red-impact transition-all"
          aria-label="Verwijderen"
        >
          <X size={16} />
        </button>
      )}

      {/* Content */}
      <div className="pl-4 pr-6">
        {/* Title with arrow */}
        <div className="flex items-center gap-2 mb-2">
          {page.crossLink && (
            <ExternalLink size={14} className="text-ru-blue flex-shrink-0" />
          )}
          <span className={`font-semibold text-ru-red-impact hover:underline flex-1 ${page.crossLink ? 'italic' : ''}`}>
            {page.title || 'Naamloze pagina'}
          </span>
          <ArrowRight size={16} className="text-ru-red-impact flex-shrink-0" />
        </div>

        {/* Description */}
        <p className="text-sm text-ru-text-light leading-relaxed line-clamp-2">
          {page.description || 'Geen beschrijving'}
        </p>

        {/* Content indicator */}
        <div className="flex items-center gap-2 mt-2 text-xs text-ru-gray">
          {page.crossLink && (
            <span className="bg-ru-blue/10 text-ru-blue px-2 py-0.5 rounded">
              Externe link
            </span>
          )}
          {page.content && (
            <span className="bg-ru-light-gray px-2 py-0.5 rounded">
              Content
            </span>
          )}
          {page.sections && page.sections.length > 0 && (
            <span className="bg-ru-light-gray px-2 py-0.5 rounded">
              {page.sections.length} {page.sections.length === 1 ? 'sectie' : 'secties'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

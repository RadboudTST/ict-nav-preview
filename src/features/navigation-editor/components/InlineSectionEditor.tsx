import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { ContentSection } from '../types/navigation.types';
import { confirm } from '@/components/ui';
import TipTapInlineField from './TipTapInlineField';
import TipTapEditor from './TipTapEditor';

interface InlineSectionEditorProps {
  section: ContentSection;
  onUpdate: (updates: Partial<ContentSection>) => void;
  onDelete: () => void;
  isReadOnly?: boolean;
}

export default function InlineSectionEditor({ section, onUpdate, onDelete, isReadOnly = false }: InlineSectionEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: 'section',
      section,
    },
    disabled: isReadOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleSave = (newTitle: string) => {
    onUpdate({ title: newTitle });
  };

  const handleContentSave = (newContent: string) => {
    onUpdate({ content: newContent });
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Sectie verwijderen',
      message: `Weet je zeker dat je "${section.title || 'deze sectie'}" wilt verwijderen?`,
      confirmLabel: 'Verwijderen',
      variant: 'danger',
    });
    if (confirmed) {
      onDelete();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative py-4 border-l-4 border-transparent
        hover:border-ru-red-impact/30
        transition-all duration-200
        ${isDragging ? 'opacity-50 bg-ru-light-gray rounded' : ''}
      `}
    >
      {/* Drag handle - visible on hover, hidden in read-only mode */}
      {!isReadOnly && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-8 top-4 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-ru-gray hover:text-ru-text transition-opacity"
          aria-label="Sleep om te herordenen"
        >
          <GripVertical size={20} />
        </button>
      )}

      {/* Delete button - visible on hover, hidden in read-only mode */}
      {!isReadOnly && (
        <button
          onClick={handleDeleteClick}
          className="absolute -right-2 top-4 opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-ru-light-gray text-ru-gray hover:text-ru-red-impact transition-all"
          aria-label="Sectie verwijderen"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* Section Title - TipTap inline field */}
      <div className="mb-3">
        <TipTapInlineField
          value={section.title}
          onSave={handleTitleSave}
          placeholder="Sectie titel..."
          className="text-lg font-bold text-ru-maroon"
          disabled={isReadOnly}
        />
      </div>

      {/* Section Content - TipTap rich editor */}
      <TipTapEditor
        content={section.content}
        onUpdate={handleContentSave}
        placeholder="Schrijf hier de inhoud van deze sectie..."
        minHeight="100px"
        editable={!isReadOnly}
      />
    </div>
  );
}

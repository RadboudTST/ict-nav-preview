import { ArrowLeft, Plus } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PageItem, Category } from '../types/navigation.types';
import { useNavigationStore } from '../hooks';
import TipTapInlineField from './TipTapInlineField';
import TipTapEditor from './TipTapEditor';
import InlineSectionEditor from './InlineSectionEditor';

interface InlinePageEditorProps {
  page: PageItem;
  parentCategory: Category;
  onBack: () => void;
  isReadOnly?: boolean;
}

export default function InlinePageEditor({ page, parentCategory, onBack, isReadOnly = false }: InlinePageEditorProps) {
  const {
    updatePageContent,
    addPageSection,
    updatePageSection,
    deletePageSection,
    reorderPageSections,
  } = useNavigationStore();

  // Save handlers
  const handleTitleSave = (newTitle: string) => {
    updatePageContent(parentCategory.id, page.id, { title: newTitle });
  };

  const handleDescriptionSave = (newDescription: string) => {
    updatePageContent(parentCategory.id, page.id, { description: newDescription });
  };

  const handleContentSave = (newContent: string) => {
    updatePageContent(parentCategory.id, page.id, { content: newContent });
  };

  // Section handlers
  const handleAddSection = () => {
    addPageSection(parentCategory.id, page.id, 'Nieuwe sectie');
  };

  const handleUpdateSection = (sectionId: string, updates: { title?: string; content?: string }) => {
    updatePageSection(parentCategory.id, page.id, sectionId, updates);
  };

  const handleDeleteSection = (sectionId: string) => {
    deletePageSection(parentCategory.id, page.id, sectionId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sections = page.sections || [];
    const activeIndex = sections.findIndex((s) => s.id === active.id);
    const overIndex = sections.findIndex((s) => s.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      reorderPageSections(parentCategory.id, page.id, activeIndex, overIndex);
    }
  };

  const sections = page.sections || [];

  return (
    <div className="max-w-4xl">
      {/* Back button and breadcrumb */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ru-red-impact hover:text-ru-berry transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Terug naar {parentCategory.label}</span>
        </button>

        {/* Breadcrumb */}
        <nav className="text-sm text-ru-text-light">
          <span>ICT</span>
          <span className="mx-2">{'>'}</span>
          <span>{parentCategory.label}</span>
          <span className="mx-2">{'>'}</span>
          <span className="text-ru-text">{page.title}</span>
        </nav>
      </div>

      {/* Page content in ru.nl style */}
      <div className="bg-white rounded-lg shadow-sm border border-ru-border p-8">
        {/* Title - editable with TipTap */}
        <div className="mb-2">
          <TipTapInlineField
            value={page.title}
            onSave={handleTitleSave}
            placeholder="Pagina titel..."
            className="text-3xl font-bold text-ru-red-impact"
            disabled={isReadOnly}
          />
        </div>

        {/* Red underline like ru.nl */}
        <div className="w-16 h-1 bg-ru-red-impact mb-6" />

        {/* Description (for card preview) - editable */}
        <div className="mb-6 pb-6 border-b border-ru-border">
          <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider block mb-2">
            Korte beschrijving (voor kaarten)
          </span>
          <TipTapInlineField
            value={page.description}
            onSave={handleDescriptionSave}
            placeholder="Korte beschrijving voor de preview kaart..."
            className="text-ru-text"
            multiline
            disabled={isReadOnly}
          />
        </div>

        {/* Main content - TipTap rich editor */}
        {(page.content || !sections.length) && (
          <div className="mb-8">
            <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider block mb-2">
              Pagina inhoud
            </span>
            <TipTapEditor
              content={page.content || ''}
              onUpdate={handleContentSave}
              placeholder="Begin met het schrijven van de pagina inhoud..."
              minHeight="200px"
              editable={!isReadOnly}
            />
          </div>
        )}

        {/* Sections */}
        {sections.length > 0 && (
          <div className="mb-8">
            <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider block mb-4">
              Secties
            </span>
            <div className="pl-4 border-l-2 border-ru-light-gray">
              {isReadOnly ? (
                // Read-only mode: render without DnD context
                sections.map((section) => (
                  <InlineSectionEditor
                    key={section.id}
                    section={section}
                    onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                    onDelete={() => handleDeleteSection(section.id)}
                    isReadOnly={isReadOnly}
                  />
                ))
              ) : (
                // Edit mode: enable DnD
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map((section) => (
                      <InlineSectionEditor
                        key={section.id}
                        section={section}
                        onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                        onDelete={() => handleDeleteSection(section.id)}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}

        {/* Add section button - hidden in read-only mode */}
        {!isReadOnly && (
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 w-full justify-center py-3 border-2 border-dashed border-ru-border rounded-lg text-ru-text-light hover:border-ru-red-impact hover:text-ru-red-impact transition-colors"
          >
            <Plus size={20} />
            Sectie toevoegen
          </button>
        )}

        {/* Last modified */}
        {page.lastModified && (
          <p className="text-xs text-ru-text-light text-right mt-6 pt-4 border-t border-ru-border">
            Laatst gewijzigd: {new Date(page.lastModified).toLocaleString('nl-NL')}
          </p>
        )}
      </div>

      {/* Help text */}
      <p className="text-sm text-ru-text-light text-center mt-4">
        {isReadOnly
          ? 'Alleen lezen - schakel naar "Nieuw (voorstel)" om te bewerken'
          : 'Klik op tekst om te bewerken | Wijzigingen worden automatisch opgeslagen'}
      </p>
    </div>
  );
}

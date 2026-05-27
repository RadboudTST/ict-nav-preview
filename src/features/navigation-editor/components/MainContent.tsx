import { MousePointer2, Keyboard, Move, FileJson, FileSpreadsheet, FileCode, Plus, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useNavigationStore } from '../hooks';
import { findCategoryById } from '../utils/tree-helpers';
import { PageItem, Category } from '../types/navigation.types';
import PageCard from './PageCard';
import InlinePageEditor from './InlinePageEditor';
import TipTapInlineField from './TipTapInlineField';
import TipTapEditor from './TipTapEditor';
import InlineSectionEditor from './InlineSectionEditor';
import { ErrorBoundary } from '@/components/ui';

export default function MainContent() {
  const {
    categories,
    selectedId,
    selectedPageId,
    selectedPageParentId,
    addPage,
    deletePage,
    reorderPages,
    clearSelectedPage,
    updateLabel,
    updateCategoryDescription,
    updateCategoryContent,
    addCategorySection,
    updateCategorySection,
    deleteCategorySection,
    reorderCategorySections,
    isReadOnly,
  } = useNavigationStore();

  // Find the selected page and its parent category
  const findSelectedPage = (): { page: PageItem; parentCategory: Category } | null => {
    if (!selectedPageId || !selectedPageParentId) return null;
    const parentCategory = findCategoryById(categories, selectedPageParentId);
    if (!parentCategory || !parentCategory.pages) return null;
    const page = parentCategory.pages.find((p) => p.id === selectedPageId);
    if (!page) return null;
    return { page, parentCategory };
  };

  const selectedPageData = findSelectedPage();

  // In flat structure, selectedId always refers to a category
  const selectedCategory = selectedId ? findCategoryById(categories, selectedId) : null;

  const getDescription = (): string => {
    if (!selectedCategory) return '';
    const pageCount = selectedCategory.pages?.length || 0;
    return `Deze categorie bevat ${pageCount} pagina${pageCount === 1 ? '' : "'s"}.`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedId) return;
    reorderPages(selectedId, active.id as string, over.id as string);
  };

  const handleAddPage = () => {
    if (!selectedId) return;
    addPage(selectedId, 'Nieuwe pagina', 'Beschrijving van de pagina...');
    toast.success('Nieuwe pagina toegevoegd');
  };

  const handleDeletePage = (pageId: string) => {
    if (!selectedId) return;
    deletePage(selectedId, pageId);
  };

  const pages = selectedCategory?.pages || [];
  const categorySections = selectedCategory?.sections || [];

  const handleCategorySectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !selectedId) return;
    const fromIndex = categorySections.findIndex((s) => s.id === active.id);
    const toIndex = categorySections.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderCategorySections(selectedId, fromIndex, toIndex);
    }
  };

  // If a page is selected, show the inline page editor
  if (selectedPageData) {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-ru-light-gray/30">
        <InlinePageEditor
          page={selectedPageData.page}
          parentCategory={selectedPageData.parentCategory}
          onBack={clearSelectedPage}
          isReadOnly={isReadOnly}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto bg-ru-light-gray/30">
      <div className="max-w-4xl">
        {selectedCategory ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-ru-border p-6">
              <div className="mb-4">
                <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider">
                  Categorie
                </span>
              </div>
              {/* Category label - editable */}
              <div className="mb-4">
                <TipTapInlineField
                  value={selectedCategory.label}
                  onSave={(newLabel) => updateLabel(selectedCategory.id, newLabel)}
                  placeholder="Categorie naam..."
                  className="text-2xl font-bold text-ru-maroon"
                  disabled={isReadOnly}
                />
              </div>
              {/* Category description - editable */}
              {(selectedCategory.description || !isReadOnly) && (
                <div className="mb-4">
                  <TipTapInlineField
                    value={selectedCategory.description || ''}
                    onSave={(newDesc) => updateCategoryDescription(selectedCategory.id, newDesc)}
                    placeholder="Beschrijving toevoegen..."
                    className="text-ru-text text-lg"
                    multiline
                    disabled={isReadOnly}
                  />
                </div>
              )}
              <p className="text-ru-text-light">{getDescription()}</p>
              <div className="mt-4 p-4 bg-ru-light-gray rounded">
                <p className="text-sm text-ru-text">
                  {isReadOnly ? (
                    <>
                      <strong>Let op:</strong> Dit is de originele RU.nl structuur (alleen lezen).
                      Schakel naar <strong>Bewerken</strong> om wijzigingen te maken.
                    </>
                  ) : (
                    <>
                      <strong>Tip:</strong> Klik op een pagina om de inhoud te bewerken. Sleep om te herordenen.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Category Content Card */}
            <div className="bg-white rounded-lg shadow-sm border border-ru-border p-6">
              {/* Main content editor */}
              {(selectedCategory.content || !categorySections.length) && (
                <div className="mb-8">
                  <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider block mb-2">
                    Pagina inhoud
                  </span>
                  <ErrorBoundary name="Editor">
                    <TipTapEditor
                      content={selectedCategory.content || ''}
                      onUpdate={(val) => updateCategoryContent(selectedCategory.id, { content: val })}
                      placeholder="Begin met het schrijven van de categorie inhoud..."
                      minHeight="200px"
                      editable={!isReadOnly}
                    />
                  </ErrorBoundary>
                </div>
              )}

              {/* Sections */}
              {categorySections.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-ru-text-light uppercase tracking-wider">
                      Secties
                    </span>
                    {!isReadOnly && (
                      <label className="flex items-center gap-2 text-sm text-ru-text cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!selectedCategory.useAccordion}
                          onChange={() =>
                            updateCategoryContent(selectedCategory.id, { useAccordion: !selectedCategory.useAccordion })
                          }
                          className="accent-ru-red-impact"
                        />
                        <ChevronDown size={14} className="text-ru-maroon" />
                        Accordion weergave (inklapbaar in preview)
                      </label>
                    )}
                  </div>
                  <div className={`pl-4 border-l-2 ${selectedCategory.useAccordion ? 'border-ru-red-impact' : 'border-ru-light-gray'}`}>
                    {isReadOnly ? (
                      categorySections.map((section) => (
                        <InlineSectionEditor key={section.id} section={section}
                          onUpdate={(u) => updateCategorySection(selectedCategory.id, section.id, u)}
                          onDelete={() => deleteCategorySection(selectedCategory.id, section.id)}
                          isReadOnly />
                      ))
                    ) : (
                      <DndContext collisionDetection={closestCenter} onDragEnd={handleCategorySectionDragEnd}>
                        <SortableContext items={categorySections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                          {categorySections.map((section) => (
                            <InlineSectionEditor key={section.id} section={section}
                              onUpdate={(u) => updateCategorySection(selectedCategory.id, section.id, u)}
                              onDelete={() => deleteCategorySection(selectedCategory.id, section.id)}
                              isReadOnly={false} />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              )}

              {/* Add section button */}
              {!isReadOnly && (
                <button
                  onClick={() => addCategorySection(selectedCategory.id, 'Nieuwe sectie')}
                  className="flex items-center gap-2 w-full justify-center py-3 border-2 border-dashed border-ru-border rounded-lg text-ru-text-light hover:border-ru-red-impact hover:text-ru-red-impact transition-colors"
                >
                  <Plus size={20} />
                  Sectie toevoegen
                </button>
              )}
            </div>

            {/* Pages Section */}
            <div className="bg-white rounded-lg shadow-sm border border-ru-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-ru-maroon">
                  Pagina's ({pages.length})
                </h3>
                {!isReadOnly && (
                  <button
                    onClick={handleAddPage}
                    className="flex items-center gap-2 px-4 py-2 bg-ru-red-impact text-white rounded-lg hover:bg-ru-berry transition-colors"
                  >
                    <Plus size={18} />
                    Pagina toevoegen
                  </button>
                )}
              </div>

              {pages.length > 0 ? (
                isReadOnly ? (
                  // Read-only mode: render without DnD context
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pages.map((page) => (
                      <PageCard
                        key={page.id}
                        page={page}
                        parentId={selectedCategory.id}
                        onDelete={handleDeletePage}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                ) : (
                  // Edit mode: enable DnD
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pages.map((page) => (
                          <PageCard
                            key={page.id}
                            page={page}
                            parentId={selectedCategory.id}
                            onDelete={handleDeletePage}
                            isReadOnly={isReadOnly}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-ru-border rounded-lg">
                  <p className="text-ru-text-light mb-4">
                    {isReadOnly
                      ? 'Er zijn geen pagina\'s in deze categorie.'
                      : 'Er zijn nog geen pagina\'s toegevoegd aan dit item.'}
                  </p>
                  {!isReadOnly && (
                    <button
                      onClick={handleAddPage}
                      className="inline-flex items-center gap-2 px-4 py-2 text-ru-red-impact border border-ru-red-impact rounded-lg hover:bg-ru-red-impact hover:text-white transition-colors"
                    >
                      <Plus size={18} />
                      Eerste pagina toevoegen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-ru-border p-8">
            <h2 className="text-2xl font-bold text-ru-maroon mb-6">
              Welkom bij de RU Navigatie Editor
            </h2>
            <p className="text-ru-text mb-8">
              Met deze editor kun je de navigatiestructuur van de ICT-servicepagina aanpassen.
              Selecteer een item in de zijbalk om te beginnen.
            </p>

            {/* Instructions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-ru-maroon mb-4">Sneltoetsen & Tips</h3>

              <div className="flex items-start gap-3">
                <MousePointer2 className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Klik om te bewerken</p>
                  <p className="text-sm text-ru-text-light">
                    Klik op een pagina om de inhoud direct inline te bewerken.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Move className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Drag & drop</p>
                  <p className="text-sm text-ru-text-light">
                    Sleep categorieën om ze te herordenen. Pagina's kunnen ook gesleept worden.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Keyboard className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Undo/Redo</p>
                  <p className="text-sm text-ru-text-light">
                    Gebruik Ctrl+Z (undo) en Ctrl+Shift+Z (redo) om wijzigingen ongedaan te maken.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileJson className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Exporteren naar JSON</p>
                  <p className="text-sm text-ru-text-light">
                    Download de structuur als JSON-bestand voor verdere verwerking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileSpreadsheet className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Exporteren naar Excel</p>
                  <p className="text-sm text-ru-text-light">
                    Download de structuur als Excel-bestand met categorieën en pagina's.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileCode className="text-ru-blue mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-ru-text">Exporteren naar HTML</p>
                  <p className="text-sm text-ru-text-light">
                    Download als HTML-bestand om de structuur in een browser te bekijken.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

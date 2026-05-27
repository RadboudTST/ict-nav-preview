import { FileText, ChevronRight, List, Columns3 } from 'lucide-react';
import { useNavigationStore } from '../hooks';

export default function ColumnsLayout() {
  const {
    categories,
    selectedId,
    setSelected,
    selectPage,
    selectedPageId,
    clearSelectedPage,
    isReadOnly,
    activeStructure,
    layoutMode,
    setLayoutMode,
  } = useNavigationStore();

  const handleCategoryClick = (categoryId: string) => {
    clearSelectedPage();
    setSelected(categoryId);
  };

  const handlePageClick = (categoryId: string, pageId: string) => {
    setSelected(categoryId);
    selectPage(categoryId, pageId);
  };

  return (
    <div className="flex-1 overflow-hidden bg-ru-light-gray">
      {/* Header */}
      <div className="h-14 bg-white border-b border-ru-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-ru-red-impact">ICT</h1>
          <span className="text-sm text-ru-text-light">
            {categories.length} categorieën
          </span>
          {/* Layout Toggle */}
          <div className="flex gap-1 ml-2">
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
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              activeStructure === 'current'
                ? 'bg-ru-blue/10 text-ru-blue'
                : 'bg-ru-green/10 text-ru-green'
            }`}
          >
            {activeStructure === 'current' ? 'RU.nl' : 'Bewerken'}
          </span>
          {isReadOnly && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-ru-light-gray text-ru-text-light">
              Alleen lezen
            </span>
          )}
        </div>
      </div>

      {/* Columns container */}
      <div className="h-[calc(100%-3.5rem)] overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {categories.map((category) => {
            const isSelected = selectedId === category.id;
            const pageCount = category.pages?.length || 0;

            return (
              <div
                key={category.id}
                className={`w-72 flex-shrink-0 bg-white rounded-xl border-2 transition-all duration-150 flex flex-col ${
                  isSelected
                    ? 'border-ru-red-impact shadow-lg'
                    : 'border-ru-border hover:border-ru-red-impact/30 hover:shadow-md'
                }`}
              >
                {/* Category header */}
                <button
                  onClick={() => handleCategoryClick(category.id)}
                  className="w-full text-left p-4 border-b border-ru-border/50 hover:bg-ru-light-gray/30 transition-colors"
                >
                  <h2 className="font-semibold text-ru-maroon text-base leading-tight">
                    {category.label}
                  </h2>
                  {category.description && (
                    <p className="text-xs text-ru-text-light mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-ru-gray">
                      {pageCount} {pageCount === 1 ? 'pagina' : "pagina's"}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-ru-red-impact" />
                    )}
                  </div>
                </button>

                {/* Pages list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {category.pages?.map((page) => {
                    const isPageSelected = selectedPageId === page.id;

                    return (
                      <button
                        key={page.id}
                        onClick={() => handlePageClick(category.id, page.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors group ${
                          isPageSelected
                            ? 'bg-ru-red-impact/10 border border-ru-red-impact/30'
                            : 'hover:bg-ru-light-gray border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText
                            size={14}
                            className={`flex-shrink-0 mt-0.5 ${
                              isPageSelected ? 'text-ru-red-impact' : 'text-ru-gray'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-sm font-medium truncate ${
                                  isPageSelected ? 'text-ru-red-impact' : 'text-ru-text'
                                }`}
                              >
                                {page.title}
                              </span>
                              <ChevronRight
                                size={12}
                                className={`flex-shrink-0 transition-opacity ${
                                  isPageSelected
                                    ? 'text-ru-red-impact opacity-100'
                                    : 'text-ru-gray opacity-0 group-hover:opacity-100'
                                }`}
                              />
                            </div>
                            {page.description && (
                              <p className="text-xs text-ru-text-light mt-0.5 line-clamp-2">
                                {page.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {(!category.pages || category.pages.length === 0) && (
                    <div className="text-center py-8 text-sm text-ru-gray">
                      Geen pagina's
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

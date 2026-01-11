import { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigationStore } from '../../hooks';
import { findCategoryById } from '../../utils/tree-helpers';
import { ictRootPage } from '../../data/initial-structure';
import { Category, PageItem } from '../../types/navigation.types';
import PreviewPageCard from './PreviewPageCard';
import PreviewPageDetail from './PreviewPageDetail';

export default function PreviewMainContent() {
  const { categories, selectedPreviewId, setPreviewSelection } = useNavigationStore();
  const [viewingPage, setViewingPage] = useState<{ page: PageItem; parentId: string } | null>(null);

  // Reset page view when category selection changes
  useEffect(() => {
    setViewingPage(null);
  }, [selectedPreviewId]);

  // In flat structure, selectedPreviewId always refers to a category
  const selectedCategory = selectedPreviewId ? findCategoryById(categories, selectedPreviewId) : null;

  // Find category by ID
  const findParentCategory = (categoryId: string): Category | null => {
    return findCategoryById(categories, categoryId) || null;
  };

  // Handle page click
  const handlePageClick = (page: PageItem, parentId: string) => {
    setViewingPage({ page, parentId });
  };

  // Handle back from page detail
  const handleBackFromPage = () => {
    setViewingPage(null);
  };

  // If viewing a specific page, show the detail view
  if (viewingPage) {
    const parentCategory = findParentCategory(viewingPage.parentId);

    if (parentCategory) {
      return (
        <PreviewPageDetail
          category={parentCategory}
          page={viewingPage.page}
          onBack={handleBackFromPage}
          onNavigateToCategory={() => {
            setViewingPage(null);
            setPreviewSelection(parentCategory.id);
          }}
        />
      );
    }
  }

  // Root ICT overview page
  if (!selectedPreviewId) {
    return (
      <main className="flex-1 overflow-y-auto bg-white min-w-0">
        <div className="w-full max-w-4xl px-8 py-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-ru-text-light mb-6 flex items-center gap-1.5 flex-wrap">
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Home</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Services</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Campusfaciliteiten & gebouwen</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="text-ru-text font-medium">ICT</span>
          </nav>

          {/* Page title */}
          <h1 className="text-[42px] font-bold text-ru-red-impact leading-tight">
            {ictRootPage.title}
          </h1>
          <div className="w-24 h-1 bg-ru-red-impact mt-2 mb-6" />

          {/* Intro text */}
          <p className="text-[18px] text-ru-text leading-relaxed mb-8">
            {ictRootPage.description}
          </p>

          {/* Banner - dark red like ru.nl */}
          <div className="bg-ru-berry text-white px-6 py-4 mb-8 flex items-center justify-between">
            <span className="font-medium">{ictRootPage.banner.title}</span>
            <ExternalLink size={18} className="opacity-80" />
          </div>

          {/* Ook veel bekeken - with bullet separators */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-ru-maroon mb-3">Ook veel bekeken</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {ictRootPage.quickLinks.map((link, index) => (
                <span key={link.label} className="flex items-center">
                  <span className="text-ru-red-impact hover:underline cursor-pointer">
                    {link.label}
                  </span>
                  {index < ictRootPage.quickLinks.length - 1 && (
                    <span className="text-ru-gray mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Category buttons grid - matching ru.nl style */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setPreviewSelection(category.id)}
                className="border-2 border-ru-red-impact text-ru-red-impact px-5 py-3.5 text-left font-medium hover:bg-ru-red-impact hover:text-white transition-colors flex items-center justify-between group"
              >
                <span>{category.label}</span>
                <ChevronRight size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {/* Featured cards - as simple list items like ru.nl */}
          <div className="border-t border-ru-border pt-8">
            <div className="space-y-6">
              {ictRootPage.featuredCards.map((card) => (
                <div key={card.id} className="group cursor-pointer">
                  <h3 className="text-lg font-semibold text-ru-red-impact group-hover:underline inline-flex items-center gap-2">
                    {card.title}
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-ru-text mt-1 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Category page (flat structure - all selections are categories)
  if (selectedCategory) {
    const pages = selectedCategory.pages || [];

    return (
      <main className="flex-1 overflow-y-auto bg-white min-w-0">
        <div className="w-full max-w-4xl px-8 py-6">
          {/* Breadcrumb */}
          <nav className="text-sm text-ru-text-light mb-6 flex items-center gap-1.5 flex-wrap">
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Home</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Services</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="hover:text-ru-red-impact hover:underline cursor-pointer">Campusfaciliteiten & gebouwen</span>
            <ChevronRight size={12} className="text-ru-gray" />
            <button
              onClick={() => setPreviewSelection(null)}
              className="hover:text-ru-red-impact hover:underline"
            >
              ICT
            </button>
            <ChevronRight size={12} className="text-ru-gray" />
            <span className="text-ru-text font-medium">{selectedCategory.label}</span>
          </nav>

          {/* Page title */}
          <h1 className="text-[42px] font-bold text-ru-red-impact leading-tight">
            {selectedCategory.label}
          </h1>
          <div className="w-24 h-1 bg-ru-red-impact mt-2 mb-6" />

          {/* Category description */}
          {selectedCategory.description && (
            <p className="text-[18px] text-ru-text leading-relaxed mb-8">
              {selectedCategory.description}
            </p>
          )}

          {/* Horizontal separator like ru.nl */}
          <hr className="border-ru-border mb-8" />

          {/* Pages grid - 2 columns like ru.nl */}
          {pages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
              {pages.map((page) => (
                <PreviewPageCard
                  key={page.id}
                  page={page}
                  onClick={() => handlePageClick(page, selectedCategory.id)}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {pages.length === 0 && (
            <p className="mt-8 text-ru-text-light italic">
              Er is nog geen inhoud toegevoegd aan deze categorie.
            </p>
          )}
        </div>
      </main>
    );
  }

  return null;
}

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigationStore } from '../../hooks';
import { findCategoryById } from '../../utils/tree-helpers';
import { ictRootPage } from '../../data/initial-structure';
import { Category, PageItem } from '../../types/navigation.types';
import PreviewPageCard from './PreviewPageCard';
import PreviewPageDetail from './PreviewPageDetail';
import AccordionSection from './AccordionSection';
import HtmlPreview from '../HtmlPreview';

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
        <div className="w-full max-w-[800px] py-6 px-8">
          {/* Page title */}
          <h1 className="text-[40px] font-extrabold text-ru-red-impact leading-[40px] tracking-tight">
            {ictRootPage.title}
          </h1>
          <div className="w-20 h-1 bg-ru-red-impact mt-2 mb-5" />

          {/* Intro text */}
          <p className="text-[16px] text-ru-text leading-relaxed mb-6">
            {ictRootPage.description}
          </p>

          {/* Banner - dark berry background like ru.nl */}
          <a
            href="#"
            className="bg-ru-berry text-white px-5 py-4 mb-6 flex items-center justify-between hover:bg-ru-maroon transition-colors"
          >
            <span className="font-medium">{ictRootPage.banner.title}</span>
            <ArrowRight size={18} />
          </a>

          {/* Ook veel bekeken - with bullet separators */}
          <div className="mb-6">
            <p className="text-[15px] text-ru-text mb-1">Ook veel bekeken</p>
            <div className="flex flex-wrap items-center">
              {ictRootPage.quickLinks.map((link, index) => (
                <span key={link.label} className="flex items-center">
                  <a href="#" className="text-[15px] text-ru-red-impact hover:underline">
                    {link.label}
                  </a>
                  {index < ictRootPage.quickLinks.length - 1 && (
                    <span className="text-ru-text mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Category buttons grid - matching ru.nl style */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setPreviewSelection(category.id)}
                className="border border-ru-red-impact text-ru-red-impact px-4 py-3 text-left text-[15px] font-medium hover:bg-ru-red-impact hover:text-white transition-colors flex items-center justify-between group"
              >
                <span>{category.label}</span>
                <ArrowRight size={16} className="opacity-70 group-hover:opacity-100 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>

          {/* Featured cards - 2 column grid like ru.nl */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
            {ictRootPage.featuredCards.map((card) => (
              <div key={card.id} className="group">
                <h3 className="mb-1">
                  <a
                    href="#"
                    className="text-[17px] font-bold text-ru-red-impact hover:underline inline-flex items-center gap-1"
                  >
                    {card.title}
                    <ArrowRight size={14} className="flex-shrink-0" />
                  </a>
                </h3>
                <p className="text-[14px] text-ru-text leading-relaxed">{card.description}</p>
              </div>
            ))}
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
        <div className="w-full max-w-[800px] py-6 px-8">
          {/* Page title */}
          <h1 className="text-[40px] font-extrabold text-ru-red-impact leading-[40px] tracking-tight">
            {selectedCategory.label}
          </h1>
          <div className="w-20 h-1 bg-ru-red-impact mt-2 mb-5" />

          {/* Category description */}
          {selectedCategory.description && (
            <p className="text-[16px] text-ru-text leading-relaxed mb-6">
              {selectedCategory.description}
            </p>
          )}

          {/* Category rich-text content */}
          {selectedCategory.content && (
            <div className="ru-rich-text mb-6">
              <HtmlPreview content={selectedCategory.content} />
            </div>
          )}

          {/* Category sections — accordion or flat */}
          {selectedCategory.sections && selectedCategory.sections.length > 0 && (
            selectedCategory.useAccordion ? (
              <AccordionSection
                key={selectedCategory.id}
                sections={selectedCategory.sections}
              />
            ) : (
              <div className="mt-10 mb-10 space-y-10">
                {selectedCategory.sections.map((section) => (
                  <section key={section.id}>
                    <h2 className="text-[26px] font-extrabold text-ru-maroon leading-[26px] tracking-tight mb-4">
                      {section.title}
                    </h2>
                    <div className="ru-rich-text">
                      <HtmlPreview content={section.content} />
                    </div>
                  </section>
                ))}
              </div>
            )
          )}

          {/* Horizontal separator like ru.nl */}
          <hr className="border-ru-border mb-6" />

          {/* Pages grid - 2 columns like ru.nl */}
          {pages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
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

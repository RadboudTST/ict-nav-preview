import { ChevronRight } from 'lucide-react';
import { Category, PageItem } from '../../types/navigation.types';
import HtmlPreview from '../HtmlPreview';

interface PreviewPageDetailProps {
  category: Category;
  page: PageItem;
  onBack: () => void;
  onNavigateToCategory: () => void;
}

export default function PreviewPageDetail({
  category,
  page,
  onBack,
  onNavigateToCategory,
}: PreviewPageDetailProps) {
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
            onClick={onBack}
            className="hover:text-ru-red-impact hover:underline"
          >
            ICT
          </button>
          <ChevronRight size={12} className="text-ru-gray" />
          <button
            onClick={onNavigateToCategory}
            className="hover:text-ru-red-impact hover:underline"
          >
            {category.label}
          </button>
          <ChevronRight size={12} className="text-ru-gray" />
          <span className="text-ru-text font-medium">{page.title}</span>
        </nav>

        {/* Page title */}
        <h1 className="text-[42px] font-bold text-ru-red-impact leading-tight">
          {page.title}
        </h1>
        <div className="w-24 h-1 bg-ru-red-impact mt-2 mb-6" />

        {/* Intro */}
        {page.intro && (
          <p className="text-[18px] text-ru-text leading-relaxed mb-8">
            {page.intro}
          </p>
        )}

        {/* Description as fallback if no intro */}
        {!page.intro && page.description && (
          <p className="text-[18px] text-ru-text leading-relaxed mb-8">
            {page.description}
          </p>
        )}

        {/* Main content (scraped from ru.nl) */}
        {page.content && (
          <div className="prose prose-lg max-w-none">
            <HtmlPreview content={page.content} />
          </div>
        )}

        {/* Sections */}
        {page.sections && page.sections.length > 0 && (
          <div className="mt-10 space-y-10">
            {page.sections.map((section) => (
              <section key={section.id}>
                <h2 className="text-2xl font-bold text-ru-maroon mb-4">
                  {section.title}
                </h2>
                <div className="prose prose-lg max-w-none">
                  <HtmlPreview content={section.content} />
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!page.intro && !page.description && !page.content && (!page.sections || page.sections.length === 0) && (
          <p className="mt-8 text-ru-text-light italic">
            Er is nog geen inhoud toegevoegd aan deze pagina.
          </p>
        )}

        {/* Last modified */}
        {page.lastModified && (
          <p className="text-xs text-ru-text-light mt-12 pt-4 border-t border-ru-border">
            Laatst gewijzigd: {new Date(page.lastModified).toLocaleString('nl-NL')}
          </p>
        )}
      </div>
    </main>
  );
}

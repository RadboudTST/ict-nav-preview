import { ChevronRight } from 'lucide-react';
import { Category, PageItem } from '../../types/navigation.types';
import HtmlPreview from '../HtmlPreview';
import AccordionSection from './AccordionSection';

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
        <nav className="text-[15px] text-ru-text-light mb-6 flex items-center gap-1.5 flex-wrap">
          <span className="underline hover:text-ru-red-impact cursor-pointer">Home</span>
          <ChevronRight size={12} className="text-ru-gray" />
          <span className="underline hover:text-ru-red-impact cursor-pointer">Services</span>
          <ChevronRight size={12} className="text-ru-gray" />
          <span className="underline hover:text-ru-red-impact cursor-pointer">Campusfaciliteiten & gebouwen</span>
          <ChevronRight size={12} className="text-ru-gray" />
          <button
            onClick={onBack}
            className="underline hover:text-ru-red-impact"
          >
            ICT
          </button>
          <ChevronRight size={12} className="text-ru-gray" />
          <button
            onClick={onNavigateToCategory}
            className="underline hover:text-ru-red-impact"
          >
            {category.label}
          </button>
          <ChevronRight size={12} className="text-ru-gray" />
          <span className="text-ru-text-light">{page.title}</span>
        </nav>

        {/* Page title */}
        <h1 className="text-[40px] font-extrabold text-ru-red-impact leading-[40px] tracking-tight">
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
          <div className="prose prose-lg max-w-none ru-rich-text">
            <HtmlPreview content={page.content} />
          </div>
        )}

        {/* Sections */}
        {page.sections && page.sections.length > 0 && (
          page.useAccordion ? (
            <AccordionSection key={page.id} sections={page.sections} />
          ) : (
            <div className="mt-10 space-y-10">
              {page.sections.map((section) => (
                <section key={section.id}>
                  <h2 className="text-[26px] font-extrabold text-ru-maroon leading-[26px] tracking-tight mb-4">
                    {section.title}
                  </h2>
                  <div className="prose prose-lg max-w-none ru-rich-text">
                    <HtmlPreview content={section.content} />
                  </div>
                </section>
              ))}
            </div>
          )
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
            Laatst gewijzigd: {(() => { const d = new Date(page.lastModified!); return isNaN(d.getTime()) ? page.lastModified : d.toLocaleString('nl-NL'); })()}
          </p>
        )}
      </div>
    </main>
  );
}

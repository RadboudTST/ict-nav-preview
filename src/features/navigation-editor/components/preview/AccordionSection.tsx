import { useState } from 'react';
import { ContentSection } from '../../types/navigation.types';
import HtmlPreview from '../HtmlPreview';

/** Exact arrow icon from ru.nl sprite (arrow-small), rotated 90° to point down */
function RuArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 13 13" width="16" height="16" className={className} fill="currentColor" fillRule="evenodd">
      <path d="m30.5 24 6.364 6.364-6.364 6.364-1.414-1.414 3.953-3.955L24 31.36v-2l9.031-.001-3.945-3.945L30.5 24Z" transform="translate(-24 -24)" />
    </svg>
  );
}

interface AccordionSectionProps {
  sections: ContentSection[];
}

export default function AccordionSection({ sections }: AccordionSectionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(sections.length > 0 ? [sections[0].id] : [])
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="mt-10">
      {sections.map((section, index) => {
        const isExpanded = expandedIds.has(section.id);
        return (
          <div
            key={section.id}
            className="group"
            style={{
              borderTop: index === 0
                ? '3px solid #730E04'
                : isExpanded ? '1px solid #E3000B' : '1px solid #d7d7d7',
              transition: 'border-color 0.2s',
            }}
          >
            <button
              onClick={() => toggle(section.id)}
              className="relative w-full text-left"
              style={{ padding: '20px 50px 20px 0' }}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${section.id}`}
            >
              <span
                className={`text-[26px] font-extrabold leading-none transition-colors group-hover:underline ${
                  isExpanded
                    ? 'text-[#E3000B]'
                    : 'text-[#730E04] group-hover:text-[#E3000B]'
                }`}
                style={{ letterSpacing: '-1px' }}
              >
                {section.title}
              </span>
              <RuArrow
                className={`absolute right-[10px] top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                  isExpanded ? '-rotate-90 text-[#E3000B]' : 'rotate-90 text-[#730E04]'
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden" id={`accordion-content-${section.id}`} role="region" aria-labelledby={`accordion-header-${section.id}`}>
                <div className="prose prose-lg max-w-none ru-rich-text" style={{ padding: '10px 20px 40px 0' }}>
                  <HtmlPreview content={section.content} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

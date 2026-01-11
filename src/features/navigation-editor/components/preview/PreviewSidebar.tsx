import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigationStore } from '../../hooks';

export default function PreviewSidebar() {
  const { categories, selectedPreviewId, setPreviewSelection } = useNavigationStore();

  return (
    <aside className="w-[260px] flex-shrink-0 bg-ru-light-gray/50">
      <div className="py-6">
        {/* Sidebar navigation header */}
        <div className="px-5 mb-4">
          <h2 className="text-lg font-bold text-ru-maroon">
            Campusfaciliteiten & gebouwen
          </h2>
        </div>

        {/* Parent level - simulating ru.nl hierarchy */}
        <nav>
          {/* ICT section - expandable like ru.nl */}
          <div className="border-l-4 border-ru-red-impact bg-white">
            <button
              onClick={() => setPreviewSelection(null)}
              className={`w-full text-left px-5 py-3 font-semibold text-ru-red-impact flex items-center justify-between`}
            >
              <span>ICT</span>
              <ChevronDown size={16} />
            </button>

            {/* ICT sub-items */}
            <div className="bg-white border-t border-ru-border/50">
              {categories.map((category) => {
                const isSelected = selectedPreviewId === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setPreviewSelection(category.id)}
                    className={`w-full text-left px-5 py-2.5 text-sm transition-colors flex items-center justify-between group relative ${
                      isSelected
                        ? 'text-ru-red-impact font-medium'
                        : 'text-ru-maroon hover:text-ru-red-impact'
                    }`}
                  >
                    {/* Red underline indicator for selected item */}
                    {isSelected && (
                      <span className="absolute left-5 bottom-0 w-[calc(100%-40px)] h-0.5 bg-ru-red-impact" />
                    )}
                    <span className="pl-3">{category.label}</span>
                    <ChevronRight
                      size={14}
                      className={`transition-opacity ${
                        isSelected ? 'opacity-100 text-ru-red-impact' : 'opacity-0 group-hover:opacity-50'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other sibling sections (collapsed, like ru.nl shows them) */}
          <div className="mt-1">
            <div className="px-5 py-3 text-ru-text-light text-sm hover:bg-white/50 cursor-pointer flex items-center justify-between">
              <span>Afval en recycling</span>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            <div className="px-5 py-3 text-ru-text-light text-sm hover:bg-white/50 cursor-pointer flex items-center justify-between">
              <span>Beveiliging en BHV</span>
              <ChevronRight size={14} className="opacity-50" />
            </div>
            <div className="px-5 py-3 text-ru-text-light text-sm hover:bg-white/50 cursor-pointer flex items-center justify-between">
              <span>Gebouwen en ruimtes</span>
              <ChevronRight size={14} className="opacity-50" />
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}

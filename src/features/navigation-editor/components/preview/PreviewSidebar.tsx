import { useNavigationStore } from '../../hooks';

// Sibling sections under "Campusfaciliteiten & gebouwen" - in order they appear on ru.nl
const SIBLING_SECTIONS_BEFORE = [
  'Gebouwen en ruimtes',
  'Eten en drinken',
];

const SIBLING_SECTIONS_AFTER = [
  'Materialen lenen of inzien',
  'Producten en diensten (in)kopen',
  'Communicatie en promotie',
  'Veiligheid en noodsituaties',
];

export default function PreviewSidebar() {
  const { categories, selectedPreviewId, setPreviewSelection } = useNavigationStore();

  // Use categories in their current order from the store (respects user reordering)

  return (
    <aside className="w-[260px] flex-shrink-0 bg-white pt-20 pb-6 pr-[30px]">
      {/* Sidebar navigation */}
      <nav>
        {/* Parent section header with underline */}
        <div className="mb-3">
          <a
            href="#"
            className="text-[18px] leading-[22px] font-extrabold text-ru-mahogany hover:text-ru-red-impact block pb-2 border-b-2 border-ru-red-impact"
          >
            Campusfaciliteiten & gebouwen
          </a>
        </div>

        {/* Menu items */}
        <ul>
          {/* Siblings before ICT */}
          {SIBLING_SECTIONS_BEFORE.map((section) => (
            <li key={section}>
              <a
                href="#"
                className="block py-[5px] text-[18px] leading-[24px] font-bold text-ru-maroon hover:text-ru-red-impact hover:underline"
              >
                {section}
              </a>
            </li>
          ))}

          {/* ICT - active/expanded */}
          <li>
            <a
              href="#"
              className="block py-[5px] text-[18px] leading-[22px] text-ru-red-impact font-extrabold"
              onClick={(e) => {
                e.preventDefault();
                setPreviewSelection(null);
              }}
            >
              ICT
            </a>

            {/* ICT sub-items - nested with left border */}
            <ul className="ml-3 pl-3 border-l border-ru-border mt-1">
              {categories.map((category) => {
                const isSelected = selectedPreviewId === category.id;
                return (
                  <li key={category.id}>
                    <button
                      onClick={() => setPreviewSelection(category.id)}
                      className={`w-full text-left py-[5px] text-[18px] leading-[24px] font-bold transition-colors border-b-2 hover:text-ru-red-impact ${
                        isSelected
                          ? 'text-ru-red-impact border-ru-red-impact'
                          : 'text-ru-maroon border-transparent'
                      }`}
                    >
                      {category.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* Siblings after ICT */}
          {SIBLING_SECTIONS_AFTER.map((section) => (
            <li key={section}>
              <a
                href="#"
                className="block py-[5px] text-[18px] leading-[24px] font-bold text-ru-maroon hover:text-ru-red-impact hover:underline"
              >
                {section}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

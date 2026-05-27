import { ChevronDown, Search, ArrowRight, ChevronRight } from 'lucide-react';

export default function PreviewHeader() {
  return (
    <header>
      {/* Top bar - white background, logo centered */}
      <div className="bg-white border-b border-ru-border">
        <div className="max-w-[1200px] mx-auto px-6 h-[62px] flex items-center justify-center relative">
          {/* Logo - centered */}
          <a href="#" className="flex items-center gap-2">
            <img
              src="/ru-logo-official.svg"
              alt="Radboud Universiteit"
              className="h-10"
            />
          </a>

          {/* Utility links - absolute right */}
          <div className="absolute right-6 flex items-center gap-4 text-sm">
            <a href="#" className="flex items-center gap-1 text-ru-text hover:text-ru-red-impact">
              Studenten
              <ArrowRight size={12} />
            </a>
            <span className="text-ru-border">|</span>
            <a href="#" className="flex items-center gap-1 text-ru-text hover:text-ru-red-impact">
              Medewerkers
              <ArrowRight size={12} />
            </a>
            <span className="text-ru-border">|</span>
            <a href="#" className="flex items-center gap-1 text-ru-text hover:text-ru-red-impact">
              Alumni
              <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Navigation bar - LIGHT GRAY background with BERRY text (matching ru.nl) */}
      <div className="w-full bg-[#f8f7f7]">
        <nav className="max-w-[1200px] mx-auto px-6 h-[62px] flex items-center justify-between">
          {/* Main navigation */}
          <ul className="flex">
            {['Opleidingen', 'Onderzoek', 'Services', 'Werken bij', 'Over ons'].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="flex items-center gap-1.5 px-4 text-ru-berry text-[16px] leading-[32px] font-extrabold hover:underline"
                >
                  {item}
                  <ChevronDown size={14} />
                </a>
              </li>
            ))}
          </ul>

          {/* Right side - language + search */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-ru-red-impact font-semibold">NL</span>
              <span className="text-ru-blue">EN</span>
            </div>

            {/* Search */}
            <div className="flex items-center border border-ru-border rounded overflow-hidden">
              <input
                type="text"
                placeholder="Zoek"
                className="w-28 px-3 py-1.5 text-sm bg-white text-ru-text border-0 placeholder-ru-gray focus:outline-none"
              />
              <button className="px-2.5 py-1.5 bg-white text-ru-gray border-l border-ru-border hover:text-ru-red-impact transition-colors">
                <Search size={16} />
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Breadcrumb - white background */}
      <div className="bg-white border-b border-ru-border">
        <div className="max-w-[1200px] mx-auto px-6 py-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-[15px]">
              <li>
                <a href="#" className="text-ru-text-light underline hover:text-ru-red-impact">Home</a>
              </li>
              <li className="text-ru-gray">
                <ChevronRight size={14} />
              </li>
              <li>
                <a href="#" className="text-ru-text-light underline hover:text-ru-red-impact">Services</a>
              </li>
              <li className="text-ru-gray">
                <ChevronRight size={14} />
              </li>
              <li>
                <a href="#" className="text-ru-text-light underline hover:text-ru-red-impact">Campusfaciliteiten & gebouwen</a>
              </li>
              <li className="text-ru-gray">
                <ChevronRight size={14} />
              </li>
              <li>
                <span className="text-ru-text-light">ICT</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </header>
  );
}

import { Globe, Pencil, Eye, GitCompare, ChevronRight } from 'lucide-react';
import { useNavigationStore } from '../hooks';

export default function Header() {
  const { viewMode, setViewMode } = useNavigationStore();

  return (
    <header className="bg-white border-b border-ru-border">
      {/* Top bar */}
      <div className="h-16">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Logo - left aligned */}
          <img
            src="/ru-logo-official.svg"
            alt="Radboud Universiteit"
            className="h-10"
          />

          {/* Right side */}
          <div className="flex items-center gap-4">
          {/* View mode toggle */}
          <div className="flex gap-0.5 bg-ru-light-gray rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                viewMode === 'edit'
                  ? 'bg-white text-ru-red-impact shadow-sm'
                  : 'text-ru-text hover:bg-ru-red-impact/10'
              }`}
            >
              <Pencil size={14} />
              <span>Bewerken</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                viewMode === 'preview'
                  ? 'bg-white text-ru-red-impact shadow-sm'
                  : 'text-ru-text hover:bg-ru-red-impact/10'
              }`}
            >
              <Eye size={14} />
              <span>Voorbeeld</span>
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                viewMode === 'compare'
                  ? 'bg-white text-ru-red-impact shadow-sm'
                  : 'text-ru-text hover:bg-ru-red-impact/10'
              }`}
            >
              <GitCompare size={14} />
              <span>Vergelijken</span>
            </button>
          </div>

          {/* Language toggle (decorative) */}
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-ru-text-light hover:text-ru-text rounded hover:bg-ru-light-gray transition-colors">
            <Globe size={16} />
            <span>NL</span>
            <span className="text-ru-border">|</span>
            <span className="text-ru-border">EN</span>
          </button>
        </div>
        </div>
      </div>

      {/* Breadcrumb - only show in edit mode */}
      {viewMode === 'edit' && (
        <div className="bg-ru-light-gray border-b border-ru-border">
          <div className="max-w-[1200px] mx-auto px-6 py-2">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1 text-sm">
                <li>
                  <span className="text-ru-blue hover:underline cursor-pointer">Home</span>
                </li>
                <li className="text-ru-gray"><ChevronRight size={12} /></li>
                <li>
                  <span className="text-ru-blue hover:underline cursor-pointer">Services</span>
                </li>
                <li className="text-ru-gray"><ChevronRight size={12} /></li>
                <li>
                  <span className="text-ru-blue hover:underline cursor-pointer">
                    Campusfaciliteiten & gebouwen
                  </span>
                </li>
                <li className="text-ru-gray"><ChevronRight size={12} /></li>
                <li>
                  <span className="text-ru-text font-medium">ICT</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

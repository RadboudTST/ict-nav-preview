import { useEffect } from 'react';
import { Eye, GitCompare } from 'lucide-react';
import { Header, Sidebar, MainContent, Toolbar, PreviewLayout, ColumnsLayout } from '@/features/navigation-editor';
import { CompareLayout, CompareLegend } from '@/features/navigation-editor/components/compare';
import { useNavigationStore } from '@/features/navigation-editor/hooks';
import { ToastContainer, ConfirmModal, toast, ErrorBoundary } from '@/components/ui';

export default function App() {
  const { viewMode, setViewMode, layoutMode } = useNavigationStore();

  // Keyboard shortcut for toggling preview mode (Ctrl+P / Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setViewMode(viewMode === 'edit' ? 'preview' : 'edit');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, setViewMode]);

  // Listen for localStorage quota exceeded events
  useEffect(() => {
    const handleQuotaExceeded = () => {
      toast.error(
        'Opslagruimte vol — wijzigingen worden mogelijk niet opgeslagen. Exporteer uw werk als JSON en verwijder ongebruikte inhoud.',
        { duration: 10000 }
      );
    };

    window.addEventListener('storage-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('storage-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-ru-light-gray">
      {/* Header with logo and breadcrumb - only in edit/compare mode */}
      {viewMode !== 'preview' && <Header />}

      {/* Toolbar - only in edit mode */}
      {viewMode === 'edit' && <Toolbar />}

      {/* Main content area */}
      {viewMode === 'edit' && (
        <ErrorBoundary name="EditMode">
          {layoutMode === 'list' && (
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar with navigation tree */}
              <Sidebar />

              {/* Main content */}
              <MainContent />
            </div>
          )}
          {layoutMode === 'columns' && <ColumnsLayout />}
        </ErrorBoundary>
      )}

      {viewMode === 'preview' && (
        <ErrorBoundary name="PreviewLayout" onReset={() => setViewMode('edit')}>
          <PreviewLayout />
        </ErrorBoundary>
      )}

      {viewMode === 'compare' && (
        <ErrorBoundary name="CompareLayout" onReset={() => setViewMode('edit')}>
          <div className="flex flex-col flex-1 overflow-hidden">
            <CompareLegend />
            <CompareLayout />
          </div>
        </ErrorBoundary>
      )}

      {/* Mode indicators */}
      {viewMode === 'preview' && (
        <button
          onClick={() => setViewMode('edit')}
          className="fixed bottom-4 right-4 bg-ru-maroon text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-ru-berry transition-colors group"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span className="font-medium">Voorbeeldmodus</span>
          <span className="text-white/60 group-hover:text-white/80 transition-colors">Klik om terug te gaan</span>
        </button>
      )}

      {viewMode === 'compare' && (
        <button
          onClick={() => setViewMode('edit')}
          className="fixed bottom-4 right-4 bg-ru-blue text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 hover:bg-ru-blue/90 transition-colors group"
        >
          <GitCompare className="w-4 h-4" aria-hidden="true" />
          <span className="font-medium">Vergelijkingsmodus</span>
          <span className="text-white/60 group-hover:text-white/80 transition-colors">Klik om terug te gaan</span>
        </button>
      )}

      {/* Toast notifications */}
      <ToastContainer />

      {/* Confirm modal */}
      <ConfirmModal />
    </div>
  );
}

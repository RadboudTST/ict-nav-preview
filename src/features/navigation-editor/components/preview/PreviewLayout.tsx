import PreviewHeader from './PreviewHeader';
import PreviewSidebar from './PreviewSidebar';
import PreviewMainContent from './PreviewMainContent';
import PreviewFooter from './PreviewFooter';

export default function PreviewLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ru.nl-style header with navigation */}
      <PreviewHeader />

      {/* Main content area with sidebar */}
      <div className="flex-1">
        <div className="flex w-full max-w-[1200px] mx-auto">
          <PreviewSidebar />
          <PreviewMainContent />
        </div>
      </div>

      {/* ru.nl-style footer */}
      <PreviewFooter />
    </div>
  );
}

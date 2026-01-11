import PreviewSidebar from './PreviewSidebar';
import PreviewMainContent from './PreviewMainContent';

export default function PreviewLayout() {
  return (
    <div className="flex flex-1 w-full h-full bg-ru-light-gray/30">
      <div className="flex w-full max-w-[1280px] mx-auto shadow-sm">
        <PreviewSidebar />
        <PreviewMainContent />
      </div>
    </div>
  );
}

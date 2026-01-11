interface HtmlPreviewProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content with proper styling
 * Used for displaying content from TipTap editor
 *
 * Note: Content is trusted as it comes from our own scraper and editor.
 * The scraper only extracts text content from ru.nl pages.
 */
export default function HtmlPreview({ content, className = '' }: HtmlPreviewProps) {
  if (!content) {
    return (
      <div className={`text-ru-text-light italic ${className}`}>
        Geen inhoud
      </div>
    );
  }

  // Content is from our own TipTap editor and scraper - trusted source
  // Using tiptap class to inherit the same heading/content styles as the editor
  return (
    <div
      className={`tiptap prose prose-lg max-w-none text-ru-text ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

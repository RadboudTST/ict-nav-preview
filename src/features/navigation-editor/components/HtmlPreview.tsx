import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface HtmlPreviewProps {
  content: string;
  className?: string;
}

/**
 * DOMPurify config matching the import sanitization in export-helpers.ts.
 * Blocks script injection vectors while allowing standard HTML from TipTap.
 */
const SANITIZE_CONFIG = {
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'style', 'svg', 'math'],
};

// Hook: strip all on* event handler attributes
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName.startsWith('on')) {
    data.keepAttr = false;
  }
});

/**
 * Renders HTML content with DOMPurify sanitization.
 * Used for displaying content from TipTap editor, scraped data, and imports.
 */
export default function HtmlPreview({ content, className = '' }: HtmlPreviewProps) {
  const sanitized = useMemo(
    () => (content ? DOMPurify.sanitize(content, SANITIZE_CONFIG) : ''),
    [content]
  );

  if (!content) {
    return (
      <div className={`text-ru-text-light italic ${className}`}>
        Geen inhoud
      </div>
    );
  }

  return (
    <div
      className={`tiptap prose prose-lg max-w-none text-ru-text ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

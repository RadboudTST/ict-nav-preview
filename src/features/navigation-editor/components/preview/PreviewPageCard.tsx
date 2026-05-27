import { ArrowRight, ExternalLink } from 'lucide-react';
import { PageItem } from '../../types/navigation.types';

interface PreviewPageCardProps {
  page: PageItem;
  onClick?: () => void;
}

export default function PreviewPageCard({ page, onClick }: PreviewPageCardProps) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full group block"
    >
      <h3 className="mb-1">
        <span className={`text-[17px] font-bold text-ru-red-impact hover:underline inline-flex items-center gap-1 ${page.crossLink ? 'italic' : ''}`}>
          {page.crossLink && <ExternalLink size={14} className="text-ru-blue flex-shrink-0" />}
          {page.title}
          <ArrowRight size={14} className="flex-shrink-0" />
        </span>
      </h3>
      {page.description && (
        <p className="text-[14px] text-ru-text leading-relaxed">{page.description}</p>
      )}
      {page.crossLink && (
        <span className="inline-block mt-1 text-xs bg-ru-blue/10 text-ru-blue px-2 py-0.5 rounded">
          Externe link
        </span>
      )}
    </button>
  );
}

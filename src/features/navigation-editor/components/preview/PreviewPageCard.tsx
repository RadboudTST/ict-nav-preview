import { ArrowRight } from 'lucide-react';
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
      <h3 className="text-xl font-bold text-ru-red-impact underline decoration-2 underline-offset-4 inline-flex items-center gap-2 hover:text-ru-berry transition-colors">
        {page.title}
        <ArrowRight size={18} className="no-underline" />
      </h3>
      {page.description && (
        <p className="text-ru-text mt-3 leading-relaxed">{page.description}</p>
      )}
    </button>
  );
}

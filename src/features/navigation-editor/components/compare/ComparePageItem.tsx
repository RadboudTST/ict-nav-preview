import { FileText, CirclePlus, CircleMinus, ArrowRightLeft, Pencil, Copy } from 'lucide-react';
import { PageItem, DifferenceType } from '../../types/navigation.types';
import { useNavigationStore } from '../../hooks';

interface ComparePageItemProps {
  page: PageItem;
  categoryLabel: string;
  variant: 'current' | 'proposed';
}

export default function ComparePageItem({
  page,
  categoryLabel,
  variant,
}: ComparePageItemProps) {
  const { getDifferenceType, isDuplicatePage, getDuplicateCategories } = useNavigationStore();

  // Check if this page is a duplicate (exists in multiple categories)
  const isDuplicate = isDuplicatePage(page.title, variant);
  const duplicateCategories = isDuplicate
    ? getDuplicateCategories(page.title, variant).filter((cat) => cat !== categoryLabel)
    : [];

  const diffType: DifferenceType = getDifferenceType(page.title, variant, 'page', categoryLabel);

  // Icon and style config for each difference type
  const diffConfig: Record<DifferenceType, { icon: typeof CirclePlus | null; iconClass: string; bgClass: string; textClass: string }> = {
    new: {
      icon: CirclePlus,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-100',
      textClass: 'text-green-700 font-medium',
    },
    removed: {
      icon: CircleMinus,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-100',
      textClass: 'text-red-400 line-through',
    },
    moved: {
      icon: ArrowRightLeft,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700 font-medium',
    },
    renamed: {
      icon: Pencil,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700 font-medium',
    },
    unchanged: {
      icon: null,
      iconClass: '',
      bgClass: '',
      textClass: 'text-ru-text-light',
    },
  };

  const config = diffConfig[diffType];
  const DiffIcon = config.icon;

  return (
    <div className="flex items-center gap-2 p-1.5 rounded text-xs">
      <FileText className={`w-3 h-3 flex-shrink-0 ${diffType === 'unchanged' ? 'text-ru-gray' : config.iconClass}`} />

      <span className={`flex-1 ${config.textClass}`}>{page.title}</span>

      {/* Duplicate indicator */}
      {isDuplicate && (
        <span
          className="p-0.5 rounded bg-purple-100 cursor-help"
          title={`Ook in: ${duplicateCategories.join(', ')}`}
        >
          <Copy className="w-3.5 h-3.5 text-purple-600" />
        </span>
      )}

      {/* Difference indicator */}
      {DiffIcon && (
        <span className={`p-0.5 rounded ${config.bgClass}`}>
          <DiffIcon className={`w-3.5 h-3.5 ${config.iconClass}`} />
        </span>
      )}
    </div>
  );
}

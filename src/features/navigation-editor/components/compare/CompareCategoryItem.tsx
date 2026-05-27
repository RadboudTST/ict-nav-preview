import { useState } from 'react';
import { ChevronDown, ChevronRight, CirclePlus, CircleMinus, ArrowRightLeft } from 'lucide-react';
import { Category, DifferenceType } from '../../types/navigation.types';
import { useNavigationStore } from '../../hooks';
import ComparePageItem from './ComparePageItem';

interface CompareCategoryItemProps {
  category: Category;
  variant: 'current' | 'proposed';
}

export default function CompareCategoryItem({
  category,
  variant,
}: CompareCategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getDifferenceType } = useNavigationStore();

  const diffType: DifferenceType = getDifferenceType(category.label, variant, 'category');

  // Style and icon config for each difference type
  const diffConfig: Record<DifferenceType, {
    icon: typeof CirclePlus | null;
    iconClass: string;
    bgClass: string;
    containerClass: string;
    labelClass: string;
  }> = {
    new: {
      icon: CirclePlus,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-100',
      containerClass: 'bg-green-50 border-l-4 border-green-500',
      labelClass: 'text-green-700',
    },
    removed: {
      icon: CircleMinus,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-100',
      containerClass: 'bg-red-50 border-l-4 border-red-500 opacity-60',
      labelClass: 'text-red-700',
    },
    moved: {
      icon: ArrowRightLeft,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      containerClass: 'bg-amber-50 border-l-4 border-amber-500',
      labelClass: 'text-amber-700',
    },
    unchanged: {
      icon: null,
      iconClass: '',
      bgClass: '',
      containerClass: '',
      labelClass: 'text-ru-maroon',
    },
  };

  const config = diffConfig[diffType];
  const DiffIcon = config.icon;
  const pageCount = category.pages?.length || 0;

  return (
    <div className={`rounded ${config.containerClass}`}>
      {/* Category header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full p-2 hover:bg-black/5 rounded text-left"
        aria-expanded={isExpanded}
        aria-label={`${category.label} ${isExpanded ? 'inklappen' : 'uitklappen'}`}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-ru-gray flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-ru-gray flex-shrink-0" />
        )}
        <span className={`font-semibold flex-1 ${config.labelClass}`}>{category.label}</span>

        {/* Difference indicator with icon badge */}
        {DiffIcon && (
          <span className={`p-1 rounded ${config.bgClass}`}>
            <DiffIcon className={`w-4 h-4 ${config.iconClass}`} />
          </span>
        )}

        {/* Page count */}
        <span className="text-xs text-ru-gray">
          {pageCount} pagina{pageCount !== 1 ? "'s" : ''}
        </span>
      </button>

      {/* Pages */}
      {isExpanded && pageCount > 0 && (
        <div className="ml-6 space-y-1 pb-2">
          {category.pages!.map((page) => (
            <ComparePageItem
              key={page.id}
              page={page}
              categoryLabel={category.label}
              variant={variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}

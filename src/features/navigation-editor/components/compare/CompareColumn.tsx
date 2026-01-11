import { Category } from '../../types/navigation.types';
import CompareCategoryItem from './CompareCategoryItem';

interface CompareColumnProps {
  title: string;
  subtitle: string;
  categories: Category[];
  variant: 'current' | 'proposed';
}

export default function CompareColumn({
  title,
  subtitle,
  categories,
  variant,
}: CompareColumnProps) {
  return (
    <div className="relative">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 p-6 pb-4 border-b border-ru-border/50">
        <h2 className={`text-2xl font-bold ${variant === 'current' ? 'text-ru-blue' : 'text-ru-green'}`}>
          {title}
        </h2>
        <p className="text-sm text-ru-gray mt-1">{subtitle}</p>
      </div>

      {/* Navigation tree */}
      <div className="space-y-3 p-6 pt-4">
        {categories.map((category) => (
          <CompareCategoryItem
            key={category.id}
            category={category}
            variant={variant}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="mx-6 mb-6 pt-4 border-t border-ru-border text-sm text-ru-gray">
        <p>{categories.length} categorieën</p>
        <p>
          {categories.reduce((acc, cat) => acc + (cat.pages?.length || 0), 0)} pagina's
        </p>
      </div>
    </div>
  );
}

import { CirclePlus, CircleMinus, ArrowRightLeft, Copy, ExternalLink } from 'lucide-react';

const legendItems = [
  {
    icon: CirclePlus,
    label: 'Nieuw',
    iconClass: 'text-green-600',
    bgClass: 'bg-green-100',
  },
  {
    icon: CircleMinus,
    label: 'Verwijderd',
    iconClass: 'text-red-600',
    bgClass: 'bg-red-100',
  },
  {
    icon: ArrowRightLeft,
    label: 'Verplaatst',
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-100',
  },
  {
    icon: Copy,
    label: 'Duplicaat',
    iconClass: 'text-purple-600',
    bgClass: 'bg-purple-100',
  },
  {
    icon: ExternalLink,
    label: 'Externe link',
    iconClass: 'text-ru-blue',
    bgClass: 'bg-ru-blue/10',
  },
];

export default function CompareLegend() {
  return (
    <div className="flex items-center justify-center px-6 py-3 bg-ru-light-gray border-b border-ru-border">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ru-text">Legenda:</span>
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`p-1 rounded ${item.bgClass}`}>
              <item.icon className={`w-3.5 h-3.5 ${item.iconClass}`} />
            </span>
            <span className="text-sm text-ru-text-light">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useRef, useCallback } from 'react';
import { useNavigationStore } from '../../hooks';
import CompareColumn from './CompareColumn';

export default function CompareLayout() {
  const { structures } = useNavigationStore();

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Sync scroll between columns
  const handleScroll = useCallback((source: 'left' | 'right') => {
    if (isSyncing.current) return;

    const sourceEl = source === 'left' ? leftRef.current : rightRef.current;
    const targetEl = source === 'left' ? rightRef.current : leftRef.current;

    if (!sourceEl || !targetEl) return;

    isSyncing.current = true;
    targetEl.scrollTop = sourceEl.scrollTop;

    // Reset sync flag after a short delay
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  }, []);

  return (
    <div className="flex h-full">
      {/* Left: Current structure */}
      <div
        ref={leftRef}
        onScroll={() => handleScroll('left')}
        className="flex-1 border-r-2 border-ru-border overflow-auto"
      >
        <CompareColumn
          title="Huidige structuur"
          subtitle="Zoals nu op ru.nl"
          categories={structures.current}
          variant="current"
        />
      </div>

      {/* Right: Proposed structure */}
      <div
        ref={rightRef}
        onScroll={() => handleScroll('right')}
        className="flex-1 overflow-auto"
      >
        <CompareColumn
          title="Nieuwe structuur"
          subtitle="Voorgestelde indeling"
          categories={structures.proposed}
          variant="proposed"
        />
      </div>
    </div>
  );
}

import { Category } from '../types/navigation.types';

// Re-export arrayMove from @dnd-kit/sortable (no custom implementation needed)
export { arrayMove } from '@dnd-kit/sortable';

/**
 * Generate a unique ID for new items.
 * Falls back to crypto.getRandomValues() for non-secure contexts (HTTP).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `item-${crypto.randomUUID()}`;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `item-${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/**
 * Find a category by ID
 */
export function findCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

import { Category } from '../types/navigation.types';

// Re-export arrayMove from @dnd-kit/sortable (no custom implementation needed)
export { arrayMove } from '@dnd-kit/sortable';

/**
 * Generate a unique ID for new items
 */
export function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Find a category by ID
 */
export function findCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal, TemporalState } from 'zundo';
import { produce } from 'immer';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { Category, NavigationActions, ContentSection, PageItem, DifferenceType } from '../types/navigation.types';
import { baseStructure, deepClone, cloneWithNewIds } from '../data/base-structure';
import { generateId, arrayMove } from '../utils/tree-helpers';
import { downloadJson, downloadExcel } from '../utils/export-helpers';

const STORAGE_KEY = 'ru-nav-editor-state-v20'; // v20: Added useAccordion flag for collapsible section support

/**
 * Safe localStorage wrapper that handles quota exceeded errors.
 * Falls back gracefully when storage is full instead of silently corrupting state.
 */
const safeStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('[NavigationStore] Failed to read from localStorage:', error);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('[NavigationStore] Failed to write to localStorage:', error);
      // Notify the user that their changes may not be saved
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Dispatch a custom event so the UI can show a warning
        window.dispatchEvent(new CustomEvent('storage-quota-exceeded', {
          detail: { key: name, size: value.length }
        }));
      }
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('[NavigationStore] Failed to remove from localStorage:', error);
    }
  },
};

/**
 * Validate that persisted data matches expected schema.
 * Returns true if valid, false if data should be reset.
 */
function isValidPersistedState(data: unknown): data is { structures: { current: Category[]; proposed: Category[] }; activeStructure: 'current' | 'proposed' } {
  if (!data || typeof data !== 'object') return false;

  const state = data as Record<string, unknown>;

  // Check structures exist
  if (!state.structures || typeof state.structures !== 'object') return false;

  const structures = state.structures as Record<string, unknown>;

  // Check both structure arrays exist
  if (!Array.isArray(structures.current) || !Array.isArray(structures.proposed)) return false;

  // Validate each category has required fields
  const validateCategory = (cat: unknown): boolean => {
    if (!cat || typeof cat !== 'object') return false;
    const c = cat as Record<string, unknown>;
    return typeof c.id === 'string' && typeof c.label === 'string';
  };

  // Validate at least basic structure of categories
  for (const cat of structures.current) {
    if (!validateCategory(cat)) return false;
  }
  for (const cat of structures.proposed) {
    if (!validateCategory(cat)) return false;
  }

  // Check activeStructure is valid
  if (state.activeStructure !== 'current' && state.activeStructure !== 'proposed') return false;

  return true;
}

// Multi-structure state type
interface MultiStructureState {
  structures: {
    current: Category[];
    proposed: Category[];
  };
  activeStructure: 'current' | 'proposed';
  selectedId: string | null;
  isDragging: boolean;
  viewMode: 'edit' | 'preview' | 'compare';
  layoutMode: 'list' | 'columns';
  selectedPreviewId: string | null;
  // Page selection for inline editing
  selectedPageId: string | null;
  selectedPageParentId: string | null;
  highlightDifferences: boolean;
  highlightDuplicates: boolean;
}

// Multi-structure actions
interface MultiStructureActions extends Omit<NavigationActions, 'reset' | 'importStructure'> {
  setActiveStructure: (key: 'current' | 'proposed') => void;
  setLayoutMode: (mode: 'list' | 'columns') => void;
  reset: () => void;
  resetCurrentStructure: () => void;
  resetToBaseStructure: () => void;
  // Only current-to-proposed is supported since 'current' is read-only
  syncStructures: (direction: 'current-to-proposed') => void;
  importStructure: (data: Category[]) => void;
}

type NavigationStore = MultiStructureState & MultiStructureActions & {
  // Computed property for backwards compatibility
  categories: Category[];
  // Read-only mode: "current" structure should not be editable
  isReadOnly: boolean;
};

// Helper to find a category by ID
function findCategory(categories: Category[], id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

// Initial structures - both start with the same base structure from ru.nl
// Using deepClone for current to preserve original IDs
// Using cloneWithNewIds for proposed to ensure independent editing
const initialStructures = {
  current: deepClone(baseStructure),
  proposed: cloneWithNewIds(baseStructure),
};

// Helper to sync categories with active structure after mutations
const syncCategories = (state: MultiStructureState) => {
  // After immer produces a new structures object, we need to update categories reference
  return {
    ...state,
    categories: state.structures[state.activeStructure],
  };
};

export const useNavigationStore = create<NavigationStore>()(
  temporal(
    persist(
      (set, get) => ({
        // State
        structures: initialStructures,
        activeStructure: 'current',
        selectedId: null,
        isDragging: false,
        viewMode: 'edit',
        layoutMode: 'list',
        selectedPreviewId: null,
        selectedPageId: null,
        selectedPageParentId: null,
        highlightDifferences: true,
        highlightDuplicates: true,

        // Categories getter - computed from active structure
        // Note: This is a placeholder, actual categories are derived via selector
        categories: initialStructures.current,

        // Read-only mode: "current" structure is always read-only (the original from ru.nl)
        // Note: This is computed in components using activeStructure === 'current'
        isReadOnly: true, // Default to current (read-only)

        // Structure switching
        setActiveStructure: (key: 'current' | 'proposed') =>
          set((state) => ({
            activeStructure: key,
            categories: state.structures[key],
            isReadOnly: key === 'current', // "current" is always read-only
            selectedId: null,
            selectedPreviewId: null,
            // Clear page selection to prevent stale references to pages in the other structure
            selectedPageId: null,
            selectedPageParentId: null,
          })),

        // CRUD - all operations work on the active structure
        // Each mutation syncs categories reference after produce
        addCategory: (label: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                draft.structures[draft.activeStructure].push({
                  id: generateId(),
                  label,
                  isExpanded: true,
                  pages: [],
                });
              })
            )
          ),

        updateLabel: (id: string, label: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const category = categories.find((c) => c.id === id);
                if (category) {
                  category.label = label;
                }
              })
            )
          ),

        updateCategoryDescription: (id: string, description: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const category = categories.find((c) => c.id === id);
                if (category) {
                  category.description = description || undefined;
                }
              })
            )
          ),

        updateCategoryContent: (id: string, updates) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const cat = findCategory(draft.structures[draft.activeStructure], id);
                if (cat) Object.assign(cat, updates);
              })
            )
          ),

        addCategorySection: (id: string, title: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const cat = findCategory(draft.structures[draft.activeStructure], id);
                if (cat) {
                  if (!cat.sections) cat.sections = [];
                  cat.sections.push({ id: generateId(), title, content: '' });
                }
              })
            )
          ),

        updateCategorySection: (id: string, sectionId: string, updates: Partial<ContentSection>) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const cat = findCategory(draft.structures[draft.activeStructure], id);
                const section = cat?.sections?.find((s) => s.id === sectionId);
                if (section) Object.assign(section, updates);
              })
            )
          ),

        deleteCategorySection: (id: string, sectionId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const cat = findCategory(draft.structures[draft.activeStructure], id);
                if (cat?.sections) {
                  const idx = cat.sections.findIndex((s) => s.id === sectionId);
                  if (idx !== -1) cat.sections.splice(idx, 1);
                }
              })
            )
          ),

        reorderCategorySections: (id: string, fromIndex: number, toIndex: number) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const cat = findCategory(draft.structures[draft.activeStructure], id);
                if (cat?.sections) cat.sections = arrayMove(cat.sections, fromIndex, toIndex);
              })
            )
          ),

        deleteItem: (id: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const categoryIndex = categories.findIndex((c) => c.id === id);
                if (categoryIndex !== -1) {
                  // Clear page selection if the selected page was in this category
                  if (draft.selectedPageParentId === id) {
                    draft.selectedPageId = null;
                    draft.selectedPageParentId = null;
                  }
                  categories.splice(categoryIndex, 1);
                  if (draft.selectedId === id) {
                    draft.selectedId = null;
                  }
                }
              })
            )
          ),

        // Page CRUD
        addPage: (parentId: string, title: string, description: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item) {
                  if (!item.pages) {
                    item.pages = [];
                  }
                  item.pages.push({
                    id: generateId(),
                    title,
                    description,
                  });
                }
              })
            )
          ),

        updatePage: (parentId: string, pageId: string, title: string, description: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page) {
                    page.title = title;
                    page.description = description;
                  }
                }
              })
            )
          ),

        deletePage: (parentId: string, pageId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const pageIndex = item.pages.findIndex((p) => p.id === pageId);
                  if (pageIndex !== -1) {
                    item.pages.splice(pageIndex, 1);
                    // Clear selection if the deleted page was selected
                    if (draft.selectedPageId === pageId) {
                      draft.selectedPageId = null;
                      draft.selectedPageParentId = null;
                    }
                  }
                }
              })
            )
          ),

        reorderPages: (parentId: string, activeId: string, overId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const activeIndex = item.pages.findIndex((p) => p.id === activeId);
                  const overIndex = item.pages.findIndex((p) => p.id === overId);
                  if (activeIndex !== -1 && overIndex !== -1) {
                    item.pages = arrayMove(item.pages, activeIndex, overIndex);
                  }
                }
              })
            )
          ),

        movePageToCategory: (fromCategoryId: string, toCategoryId: string, pageId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const fromCategory = findCategory(categories, fromCategoryId);
                const toCategory = findCategory(categories, toCategoryId);

                if (fromCategory && toCategory && fromCategory.pages) {
                  const pageIndex = fromCategory.pages.findIndex((p) => p.id === pageId);
                  if (pageIndex !== -1) {
                    // Remove page from source category
                    const [page] = fromCategory.pages.splice(pageIndex, 1);
                    // Add to target category
                    if (!toCategory.pages) {
                      toCategory.pages = [];
                    }
                    toCategory.pages.push(page);
                  }
                }
              })
            )
          ),

        // Page Selection (inline editing)
        selectPage: (parentId: string, pageId: string) =>
          set({
            selectedPageId: pageId,
            selectedPageParentId: parentId,
          }),

        clearSelectedPage: () =>
          set({
            selectedPageId: null,
            selectedPageParentId: null,
          }),

        updatePageContent: (parentId: string, pageId: string, updates: Partial<PageItem>) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page) {
                    Object.assign(page, updates);
                    page.lastModified = new Date().toISOString();
                  }
                }
              })
            )
          ),

        addPageSection: (parentId: string, pageId: string, title: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page) {
                    if (!page.sections) {
                      page.sections = [];
                    }
                    page.sections.push({
                      id: generateId(),
                      title,
                      content: '',
                    });
                    page.lastModified = new Date().toISOString();
                  }
                }
              })
            )
          ),

        updatePageSection: (parentId: string, pageId: string, sectionId: string, updates: Partial<ContentSection>) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page && page.sections) {
                    const section = page.sections.find((s) => s.id === sectionId);
                    if (section) {
                      Object.assign(section, updates);
                      page.lastModified = new Date().toISOString();
                    }
                  }
                }
              })
            )
          ),

        deletePageSection: (parentId: string, pageId: string, sectionId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page && page.sections) {
                    const sectionIndex = page.sections.findIndex((s) => s.id === sectionId);
                    if (sectionIndex !== -1) {
                      page.sections.splice(sectionIndex, 1);
                      page.lastModified = new Date().toISOString();
                    }
                  }
                }
              })
            )
          ),

        reorderPageSections: (parentId: string, pageId: string, fromIndex: number, toIndex: number) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const item = findCategory(categories, parentId);
                if (item && item.pages) {
                  const page = item.pages.find((p) => p.id === pageId);
                  if (page && page.sections) {
                    page.sections = arrayMove(page.sections, fromIndex, toIndex);
                    page.lastModified = new Date().toISOString();
                  }
                }
              })
            )
          ),

        // Organization
        reorderCategories: (activeId: string, overId: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const activeIndex = categories.findIndex((c) => c.id === activeId);
                const overIndex = categories.findIndex((c) => c.id === overId);
                if (activeIndex !== -1 && overIndex !== -1) {
                  draft.structures[draft.activeStructure] = arrayMove(categories, activeIndex, overIndex);
                }
              })
            )
          ),

        toggleExpand: (id: string) =>
          set((state) =>
            syncCategories(
              produce(state, (draft) => {
                const categories = draft.structures[draft.activeStructure];
                const category = categories.find((c) => c.id === id);
                if (category) {
                  category.isExpanded = !category.isExpanded;
                }
              })
            )
          ),

        // Selection
        setSelected: (id: string | null) => set({ selectedId: id }),
        setDragging: (isDragging: boolean) => set({ isDragging }),

        // View Mode
        setViewMode: (mode: 'edit' | 'preview' | 'compare') => set({ viewMode: mode }),
        setLayoutMode: (mode: 'list' | 'columns') => set({ layoutMode: mode }),
        setPreviewSelection: (id: string | null) => set({ selectedPreviewId: id }),
        setHighlightDifferences: (value: boolean) => set({ highlightDifferences: value }),
        setHighlightDuplicates: (value: boolean) => set({ highlightDuplicates: value }),

        // Duplicate detection for compare mode
        // Returns true if a page title appears in multiple categories within the same structure
        isDuplicatePage: (pageTitle: string, variant: 'current' | 'proposed'): boolean => {
          const state = get();
          const structure = state.structures[variant];
          const categoriesWithPage = structure.filter(
            (cat) => cat.pages?.some((p) => p.title === pageTitle)
          );
          return categoriesWithPage.length > 1;
        },

        // Returns array of category labels where the page appears (for tooltip)
        getDuplicateCategories: (pageTitle: string, variant: 'current' | 'proposed'): string[] => {
          const state = get();
          const structure = state.structures[variant];
          return structure
            .filter((cat) => cat.pages?.some((p) => p.title === pageTitle))
            .map((cat) => cat.label);
        },

        // Difference detection for compare mode
        // itemType: 'category' for categories, 'page' for pages
        // categoryLabel: required for pages to detect "moved" status
        getDifferenceType: (
          itemLabel: string,
          variant: 'current' | 'proposed',
          itemType: 'category' | 'page' = 'category',
          categoryLabel?: string
        ): DifferenceType => {
          const state = get();
          const { current, proposed } = state.structures;

          if (itemType === 'category') {
            // Category comparison: just compare labels
            const currentCatLabels = new Set(current.map(c => c.label));
            const proposedCatLabels = new Set(proposed.map(c => c.label));

            if (variant === 'proposed') {
              // In proposed column: mark as "new" if not in current
              if (!currentCatLabels.has(itemLabel)) return 'new';
            } else {
              // In current column: mark as "removed" if not in proposed
              if (!proposedCatLabels.has(itemLabel)) return 'removed';
            }
            return 'unchanged';
          }

          // Page comparison: need to check both existence and category
          // Build maps: pageTitle -> Set of categoryLabels (handles pages in multiple categories)
          const currentPageMap = new Map<string, Set<string>>();
          const proposedPageMap = new Map<string, Set<string>>();

          for (const cat of current) {
            if (cat.pages) {
              for (const page of cat.pages) {
                if (!currentPageMap.has(page.title)) {
                  currentPageMap.set(page.title, new Set());
                }
                currentPageMap.get(page.title)!.add(cat.label);
              }
            }
          }
          for (const cat of proposed) {
            if (cat.pages) {
              for (const page of cat.pages) {
                if (!proposedPageMap.has(page.title)) {
                  proposedPageMap.set(page.title, new Set());
                }
                proposedPageMap.get(page.title)!.add(cat.label);
              }
            }
          }

          const existsInCurrent = currentPageMap.has(itemLabel);
          const existsInProposed = proposedPageMap.has(itemLabel);

          if (variant === 'proposed') {
            // In proposed column
            if (!existsInCurrent) return 'new';
            // Check if moved: page exists in current but NOT in this category
            if (categoryLabel) {
              const currentCategories = currentPageMap.get(itemLabel)!;
              // Only mark as "moved" if:
              // 1. This category didn't have this page in current structure
              // 2. AND the page existed somewhere else in current
              if (!currentCategories.has(categoryLabel)) {
                return 'moved';
              }
            }
          } else {
            // In current column
            if (!existsInProposed) return 'removed';
            // Check if moved: page exists in proposed but NOT in this category
            if (categoryLabel) {
              const proposedCategories = proposedPageMap.get(itemLabel)!;
              // Only mark as "moved" if:
              // 1. This category doesn't have this page in proposed structure
              // 2. AND the page exists somewhere else in proposed
              if (!proposedCategories.has(categoryLabel)) {
                return 'moved';
              }
            }
          }

          return 'unchanged';
        },

        // Persistence
        reset: () => {
          set({
            structures: {
              current: deepClone(baseStructure),
              proposed: cloneWithNewIds(baseStructure),
            },
            categories: deepClone(baseStructure),
            activeStructure: 'current',
            isReadOnly: true, // current is always read-only
            selectedId: null,
            isDragging: false,
            viewMode: 'edit',
            selectedPreviewId: null,
            selectedPageId: null,
            selectedPageParentId: null,
            highlightDifferences: true,
            highlightDuplicates: true,
          });
          // Clear undo/redo history after reset to prevent undo-ing back to pre-reset state
          useNavigationStore.temporal.getState().clear();
        },

        resetCurrentStructure: () => {
          set((state) => {
            const newStructures = { ...state.structures };
            if (state.activeStructure === 'current') {
              newStructures.current = deepClone(baseStructure);
            } else {
              newStructures.proposed = cloneWithNewIds(baseStructure);
            }
            return {
              structures: newStructures,
              categories: newStructures[state.activeStructure],
              selectedId: null,
              selectedPreviewId: null,
              selectedPageId: null,
              selectedPageParentId: null,
            };
          });
          // Clear undo/redo history after reset
          useNavigationStore.temporal.getState().clear();
        },

        // Reset both structures to the original ru.nl base
        resetToBaseStructure: () => {
          set({
            structures: {
              current: deepClone(baseStructure),
              proposed: cloneWithNewIds(baseStructure),
            },
            categories: deepClone(baseStructure),
            activeStructure: 'current',
            isReadOnly: true, // current is always read-only
            selectedId: null,
            isDragging: false,
            viewMode: 'edit',
            selectedPreviewId: null,
            selectedPageId: null,
            selectedPageParentId: null,
            highlightDifferences: true,
            highlightDuplicates: true,
          });
          // Clear undo/redo history after reset
          useNavigationStore.temporal.getState().clear();
        },

        // Sync current structure to proposed (reset proposed to match current)
        // Only current-to-proposed is supported since 'current' is read-only
        syncStructures: (_direction: 'current-to-proposed') => {
          set((state) => {
            const newStructures = { ...state.structures };
            // Copy current to proposed with new IDs for independent editing
            newStructures.proposed = cloneWithNewIds(state.structures.current);
            return {
              structures: newStructures,
              categories: newStructures[state.activeStructure],
              selectedId: null,
              selectedPreviewId: null,
              selectedPageId: null,
              selectedPageParentId: null,
            };
          });
          // Clear undo/redo history after sync
          useNavigationStore.temporal.getState().clear();
        },

        importStructure: (data: Category[]) =>
          set((state) => {
            // Guard: prevent importing into read-only (current) structure
            if (state.activeStructure === 'current') return state;
            // Clone the imported data to prevent external mutations from affecting the store
            const clonedData = deepClone(data);
            const newStructures = { ...state.structures };
            newStructures[state.activeStructure] = clonedData;
            return {
              structures: newStructures,
              categories: clonedData,
              selectedId: null,
              selectedPreviewId: null,
              // Clear page selection since imported structure has different IDs
              selectedPageId: null,
              selectedPageParentId: null,
            };
          }),

        exportToJson: () => {
          const state = get();
          const categories = state.structures[state.activeStructure];
          downloadJson(categories, state.activeStructure);
          return JSON.stringify(categories, null, 2);
        },

        exportToExcel: async () => {
          const state = get();
          const categories = state.structures[state.activeStructure];
          await downloadExcel(categories, state.activeStructure);
        },
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => safeStorage),
        partialize: (state) => ({
          structures: state.structures,
          activeStructure: state.activeStructure,
        }),
        merge: (persistedState, currentState) => {
          // Validate persisted data - reset to defaults if invalid/corrupted
          if (!isValidPersistedState(persistedState)) {
            console.warn('[NavigationStore] Invalid persisted state detected, resetting to defaults');
            return currentState;
          }

          const structures = persistedState.structures;
          const activeStructure = persistedState.activeStructure;

          return {
            ...currentState,
            structures,
            activeStructure,
            // Ensure categories is synced with activeStructure after hydration
            categories: structures[activeStructure],
            // Ensure isReadOnly is computed based on activeStructure
            isReadOnly: activeStructure === 'current',
          };
        },
      }
    ),
    {
      limit: 200,
      partialize: (state) => ({
        structures: state.structures,
        activeStructure: state.activeStructure,
      }),
    }
  )
);

// Type for the temporal state
type PartializedState = {
  structures: { current: Category[]; proposed: Category[] };
  activeStructure: 'current' | 'proposed';
};

// Expose temporal controls with proper typing
export const useTemporalStore = <T>(
  selector: (state: TemporalState<PartializedState>) => T,
  equality?: (a: T, b: T) => boolean
): T => {
  return useStoreWithEqualityFn(useNavigationStore.temporal, selector, equality);
};

/**
 * Utility to manually clear persisted storage.
 * Useful for debugging or forcing a fresh start.
 * After clearing, call reset() or reload the page.
 */
export function clearNavigationStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.info('[NavigationStore] Storage cleared successfully');
  } catch (error) {
    console.error('[NavigationStore] Failed to clear storage:', error);
  }
}

/**
 * Get current storage key (useful for debugging)
 */
export function getStorageKey(): string {
  return STORAGE_KEY;
}

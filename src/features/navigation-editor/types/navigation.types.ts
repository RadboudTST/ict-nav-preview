export interface ContentSection {
  id: string;
  title: string;
  content: string; // Markdown or plain text
}

export interface PageItem {
  id: string;
  title: string;
  description: string; // Short description for cards
  slug?: string;
  url?: string; // Original source URL from ru.nl
  intro?: string; // Full intro paragraph
  content?: string; // Legacy: simple content field
  sections?: ContentSection[]; // Structured content sections
  lastModified?: string;
}

export interface NavItem {
  id: string;
  label: string;
  slug?: string;
  isExpanded?: boolean;
  pages?: PageItem[];
}

export interface Category extends NavItem {
  description?: string;
  url?: string; // Original source URL from ru.nl
  isExpanded: boolean;
  pages?: PageItem[];
}

export interface NavigationState {
  categories: Category[];
  selectedId: string | null;
  isDragging: boolean;
  viewMode: 'edit' | 'preview' | 'compare';
  selectedPreviewId: string | null;
  // Page selection for inline editing
  selectedPageId: string | null;
  selectedPageParentId: string | null;
  highlightDifferences: boolean;
  highlightDuplicates: boolean;
}

// Note: 'renamed' is reserved for future use when rename detection is implemented
export type DifferenceType = 'new' | 'removed' | 'moved' | 'renamed' | 'unchanged';

export interface NavigationActions {
  // CRUD
  addCategory: (label: string) => void;
  updateLabel: (id: string, label: string) => void;
  updateCategoryDescription: (id: string, description: string) => void;
  deleteItem: (id: string) => void;

  // Page CRUD
  addPage: (parentId: string, title: string, description: string) => void;
  updatePage: (parentId: string, pageId: string, title: string, description: string) => void;
  deletePage: (parentId: string, pageId: string) => void;
  reorderPages: (parentId: string, activeId: string, overId: string) => void;
  movePageToCategory: (fromCategoryId: string, toCategoryId: string, pageId: string) => void;

  // Page Selection (inline editing)
  selectPage: (parentId: string, pageId: string) => void;
  clearSelectedPage: () => void;
  updatePageContent: (parentId: string, pageId: string, updates: Partial<PageItem>) => void;
  addPageSection: (parentId: string, pageId: string, title: string) => void;
  updatePageSection: (parentId: string, pageId: string, sectionId: string, updates: Partial<ContentSection>) => void;
  deletePageSection: (parentId: string, pageId: string, sectionId: string) => void;
  reorderPageSections: (parentId: string, pageId: string, fromIndex: number, toIndex: number) => void;

  // Organization
  reorderCategories: (activeId: string, overId: string) => void;
  toggleExpand: (id: string) => void;

  // Selection
  setSelected: (id: string | null) => void;
  setDragging: (isDragging: boolean) => void;

  // View Mode
  setViewMode: (mode: 'edit' | 'preview' | 'compare') => void;
  setPreviewSelection: (id: string | null) => void;
  setHighlightDifferences: (value: boolean) => void;
  setHighlightDuplicates: (value: boolean) => void;
  getDifferenceType: (
    itemLabel: string,
    variant: 'current' | 'proposed',
    itemType?: 'category' | 'page',
    categoryLabel?: string
  ) => DifferenceType;
  isDuplicatePage: (pageTitle: string, variant: 'current' | 'proposed') => boolean;
  getDuplicateCategories: (pageTitle: string, variant: 'current' | 'proposed') => string[];

  // Persistence
  reset: () => void;
  importStructure: (data: Category[]) => void;
  exportToJson: () => string;
  exportToExcel: () => Promise<void>;
}

export type NavigationStore = NavigationState & NavigationActions;

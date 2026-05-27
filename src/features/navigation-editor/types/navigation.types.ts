export interface ContentSection {
  id: string;
  title: string;
  content: string; // Markdown or plain text
}

// Featured cards shown at bottom of ICT page (not sidebar categories)
export interface FeaturedCard {
  id: string;
  title: string;
  description: string;
  url?: string;
}

export interface PageItem {
  id: string;
  title: string;
  description: string; // Short description for cards
  url?: string; // Original source URL (for cross-links, this is the external destination URL)
  intro?: string; // Full intro paragraph
  content?: string; // Legacy: simple content field
  sections?: ContentSection[]; // Structured content sections
  lastModified?: string;
  crossLink?: boolean; // True if this page links to another section (medewerkers, handleidingen, etc.)
  useAccordion?: boolean; // When true, sections render as collapsible accordion in preview
}

export interface NavItem {
  id: string;
  label: string;
  isExpanded?: boolean;
  pages?: PageItem[];
}

export interface Category extends NavItem {
  description?: string;
  url?: string; // Original source URL from ru.nl
  isExpanded: boolean;
  pages?: PageItem[];
  content?: string;              // Rich text content for the category landing page
  sections?: ContentSection[];   // Structured sections (same as PageItem.sections)
  useAccordion?: boolean;        // When true, sections render as collapsible accordion in preview
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

export type DifferenceType = 'new' | 'removed' | 'moved' | 'unchanged';

export interface NavigationActions {
  // CRUD
  addCategory: (label: string) => void;
  updateLabel: (id: string, label: string) => void;
  updateCategoryDescription: (id: string, description: string) => void;
  updateCategoryContent: (id: string, updates: Partial<Pick<Category, 'content' | 'sections' | 'useAccordion'>>) => void;
  addCategorySection: (id: string, title: string) => void;
  updateCategorySection: (id: string, sectionId: string, updates: Partial<ContentSection>) => void;
  deleteCategorySection: (id: string, sectionId: string) => void;
  reorderCategorySections: (id: string, fromIndex: number, toIndex: number) => void;
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

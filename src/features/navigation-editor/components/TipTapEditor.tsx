import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Details, DetailsSummary, DetailsContent } from '@tiptap/extension-details';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { useEffect, useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Table as TableIcon,
  ListCollapse,
  Undo,
  Redo,
  Code,
  Quote,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  minHeight?: string;
  className?: string;
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-ru-red-impact text-white'
          : 'text-ru-gray hover:bg-ru-light-gray hover:text-ru-text'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// Toolbar component
function EditorToolbar({ editor }: { editor: Editor }) {
  // Force re-render on selection changes to update active states
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => forceUpdate((n) => n + 1);
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('URL invoeren:');
    if (url) {
      // Block dangerous URL schemes (XSS vectors)
      const trimmed = url.trim().toLowerCase();
      if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
        return;
      }
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-ru-border bg-ru-light-gray/50 rounded-t-lg">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Vet (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Cursief (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Code"
      >
        <Code size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-ru-border mx-1" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Kop 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Kop 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-ru-border mx-1" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Opsomming"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Genummerde lijst"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Citaat"
      >
        <Quote size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-ru-border mx-1" />

      {/* Link & Table */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        title="Link toevoegen"
      >
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={addTable}
        title="Tabel invoegen"
      >
        <TableIcon size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => {
          if (editor.isActive('details')) {
            editor.chain().focus().unsetDetails().run();
          } else {
            editor.chain().focus().setDetails().run();
          }
        }}
        isActive={editor.isActive('details')}
        title="Uitklapbaar blok (accordion)"
      >
        <ListCollapse size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-ru-border mx-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Ongedaan maken (Ctrl+Z)"
      >
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Opnieuw (Ctrl+Shift+Z)"
      >
        <Redo size={16} />
      </ToolbarButton>
    </div>
  );
}

// Auto-open closed accordions when pressing Enter in the title.
// This runs before the Details extension's keymap, so the content area
// becomes visible before isNodeVisible() is checked.
const DetailsAutoOpen = Extension.create({
  name: 'detailsAutoOpen',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('detailsAutoOpen'),
        props: {
          handleKeyDown(view, event) {
            if (event.key !== 'Enter') return false;
            const { $from } = view.state.selection;
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === 'detailsSummary') {
                const detailsDepth = d - 1;
                if (detailsDepth >= 0 && $from.node(detailsDepth).type.name === 'details') {
                  const detailsNode = $from.node(detailsDepth);
                  if (!detailsNode.attrs.open) {
                    const pos = $from.before(detailsDepth);
                    view.dispatch(
                      view.state.tr.setNodeMarkup(pos, undefined, {
                        ...detailsNode.attrs,
                        open: true,
                      })
                    );
                  }
                }
                break;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default function TipTapEditor({
  content,
  onUpdate,
  placeholder = 'Begin met typen...',
  editable = true,
  showToolbar = true,
  minHeight = '200px',
  className = '',
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#E3000B] underline hover:text-[#730E04]',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'font-bold text-left text-[#730E04]',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      DetailsAutoOpen,
      Details.configure({
        persist: true,
        openClassName: 'is-open',
        HTMLAttributes: { class: 'ru-accordion' },
      }),
      DetailsSummary.configure({
        HTMLAttributes: { class: 'ru-accordion-title' },
      }),
      DetailsContent.configure({
        HTMLAttributes: { class: 'ru-accordion-content' },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none',
        style: minHeight ? `min-height: ${minHeight}` : '',
      },
    },
  });

  // Sync content when it changes externally (skip if user is actively typing)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-ru-border rounded-lg overflow-hidden ${className}`}>
      {showToolbar && editable && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className="p-4"
        style={minHeight ? { minHeight } : undefined}
      />
    </div>
  );
}

// Export editor utilities for markdown conversion
export { useEditor, EditorContent };

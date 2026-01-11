import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { useEffect, useRef, useCallback } from 'react';

interface TipTapInlineFieldProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  debounceMs?: number;
  disabled?: boolean;
}

export default function TipTapInlineField({
  value,
  onSave,
  placeholder = 'Klik om te bewerken...',
  className = '',
  multiline = false,
  debounceMs = 500,
  disabled = false,
}: TipTapInlineFieldProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValueRef = useRef(value);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const debouncedSave = useCallback(
    (newValue: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        if (newValue !== lastSavedValueRef.current) {
          lastSavedValueRef.current = newValue;
          onSave(newValue);
        }
      }, debounceMs);
    },
    [onSave, debounceMs]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable most features for simple text editing
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        // Keep basic formatting (enabled by default, no config needed)
        // bold, italic, strike are enabled by default
        code: false,
        // For single line, disable hard breaks
        hardBreak: multiline ? {} : false,
      }),
      Placeholder.configure({
        placeholder: disabled ? '' : placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value ? `<p>${value}</p>` : '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Get plain text content
      const text = editor.getText();
      debouncedSave(text);
    },
    onBlur: ({ editor }) => {
      // Save immediately on blur
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const text = editor.getText();
      if (text !== lastSavedValueRef.current) {
        lastSavedValueRef.current = text;
        onSave(text);
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // For single-line fields, prevent Enter from creating new lines
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          // Blur the editor on Enter
          view.dom.blur();
          return true;
        }
        return false;
      },
    },
  });

  // Sync content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getText()) {
      // Update the lastSavedValueRef to prevent unnecessary saves
      lastSavedValueRef.current = value;
      const currentPos = editor.state.selection.from;
      editor.commands.setContent(value ? `<p>${value}</p>` : '');
      // Try to restore cursor position
      try {
        const maxPos = editor.state.doc.content.size - 1;
        editor.commands.setTextSelection(Math.min(currentPos, maxPos));
      } catch {
        // Ignore cursor restoration errors
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`
        tiptap-inline-field
        rounded px-2 py-1 -mx-2 -my-1
        transition-all duration-150
        border-2 border-transparent
        ${disabled
          ? 'cursor-default'
          : 'hover:bg-ru-light-gray/50 focus-within:border-ru-red-impact focus-within:bg-white cursor-text'
        }
        ${className}
      `}
      onClick={() => !disabled && editor.chain().focus().run()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

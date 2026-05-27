import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  disabled?: boolean;
  allowEmpty?: boolean;
}

export default function EditableText({
  value,
  onSave,
  className = '',
  placeholder = 'Voer tekst in...',
  isEditing: externalIsEditing,
  onEditStart,
  onEditEnd,
  disabled = false,
  allowEmpty = false,
}: EditableTextProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Cleanup blur timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const startEditing = () => {
    if (disabled) return; // Don't allow editing if disabled
    if (externalIsEditing === undefined) {
      setInternalIsEditing(true);
    }
    setEditValue(value);
    onEditStart?.();
  };

  const saveEdit = () => {
    const trimmedValue = editValue.trim();
    // Save if value changed AND (value is non-empty OR allowEmpty is true)
    if ((trimmedValue || allowEmpty) && trimmedValue !== value) {
      onSave(trimmedValue);
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    if (externalIsEditing === undefined) {
      setInternalIsEditing(false);
    }
    setEditValue(value);
    onEditEnd?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to fire first
    // Using ref to prevent memory leak on unmount
    blurTimeoutRef.current = setTimeout(() => {
      saveEdit();
    }, 100);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        maxLength={500}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`px-1 py-0.5 border border-ru-blue rounded bg-white focus:outline-none focus:ring-2 focus:ring-ru-blue ${className}`}
        placeholder={placeholder}
        aria-label={`Bewerk ${placeholder.toLowerCase().replace('...', '').trim() || 'tekst'}`}
      />
    );
  }

  return (
    <span
      onDoubleClick={disabled ? undefined : startEditing}
      onKeyDown={disabled ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startEditing();
        }
      }}
      className={`${disabled ? 'cursor-default' : 'cursor-text'} ${className}`}
      title={disabled ? undefined : 'Dubbelklik om te bewerken'}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? value : `${value || placeholder} - dubbelklik om te bewerken`}
    >
      {value || placeholder}
    </span>
  );
}

import { useCallback, useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Heading2, Quote } from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  // Set initial content once, and when external value differs from the editor's current content
  // (e.g. loading an existing article). We avoid clobbering the editor on every keystroke by
  // comparing against the last value we emitted.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastValue.current && value !== el.innerHTML) {
      el.innerHTML = value || '';
      lastValue.current = value;
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    if (ref.current) {
      lastValue.current = ref.current.innerHTML;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    lastValue.current = el.innerHTML;
    onChange(el.innerHTML);
  }, [onChange]);

  const handleLink = () => {
    const url = window.prompt('Enter the URL (https://...)');
    if (url) exec('createLink', url);
  };

  const handleImage = () => {
    const url = window.prompt('Enter the image URL');
    if (url) exec('insertImage', url);
  };

  const buttons = [
    { icon: Heading2, title: 'Heading', action: () => exec('formatBlock', '<h2>'), label: 'Heading' },
    { icon: Bold, title: 'Bold', action: () => exec('bold'), label: 'Bold' },
    { icon: Italic, title: 'Italic', action: () => exec('italic'), label: 'Italic' },
    { icon: Underline, title: 'Underline', action: () => exec('underline'), label: 'Underline' },
    { icon: List, title: 'Bullet list', action: () => exec('insertUnorderedList'), label: 'Bullet list' },
    { icon: ListOrdered, title: 'Numbered list', action: () => exec('insertOrderedList'), label: 'Numbered list' },
    { icon: Quote, title: 'Quote', action: () => exec('formatBlock', '<blockquote>'), label: 'Quote' },
    { icon: LinkIcon, title: 'Insert link', action: handleLink, label: 'Insert link' },
    { icon: ImageIcon, title: 'Insert image from URL', action: handleImage, label: 'Insert image' },
  ];

  return (
    <div className="border border-stone-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-500/40 focus-within:border-amber-500 transition">
      <div className="flex flex-wrap gap-1 p-2 border-b border-stone-200 bg-stone-50">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            title={b.title}
            aria-label={b.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={b.action}
            className="p-2 rounded-md text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors"
          >
            <b.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder}
        className="prose prose-stone max-w-none px-4 py-3 min-h-[18rem] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400"
      />
    </div>
  );
}

"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { LinkPreviewCard } from "./LinkPreviewCardExtension";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, label, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-border/70"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [busy, setBusy] = useState(false);

  const addLink = () => {
    const url = window.prompt("URL del enlace:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  // Inserting an atom node (image, link preview card) leaves it as a NodeSelection.
  // Collapse the selection to just after it, otherwise the next inserted node
  // replaces it instead of being placed after it.
  const moveCursorPastSelection = () => {
    editor.commands.setTextSelection(editor.state.selection.to);
  };

  const addImage = () => {
    const url = window.prompt("URL de la imagen:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
    moveCursorPastSelection();
  };

  const addLinkPreview = async () => {
    const url = window.prompt("URL del enlace externo a previsualizar:");
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok || !data.preview) {
        editor
          .chain()
          .focus()
          .insertLinkPreviewCard({ url, title: url, image: null, siteName: null })
          .run();
        moveCursorPastSelection();
        return;
      }
      const { title, image, siteName } = data.preview;
      editor.chain().focus().insertLinkPreviewCard({ url, title, image, siteName }).run();
      moveCursorPastSelection();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-background/50 rounded-t-lg">
      <ToolbarButton label="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>N</strong>
      </ToolbarButton>
      <ToolbarButton label="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>C</em>
      </ToolbarButton>
      <ToolbarButton label="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">T</span>
      </ToolbarButton>
      <ToolbarButton label="Código" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        {"</>"}
      </ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton label="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolbarButton>
      <ToolbarButton label="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton label="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton label="Lista con viñetas" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •—
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1.
      </ToolbarButton>
      <ToolbarButton label="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo;
      </ToolbarButton>
      <ToolbarButton label="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ―
      </ToolbarButton>
      <span className="w-px h-5 bg-border mx-1" />
      <ToolbarButton label="Insertar enlace" active={editor.isActive("link")} onClick={addLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton label="Insertar imagen desde URL" onClick={addImage}>
        🖼️
      </ToolbarButton>
      <ToolbarButton label="Vista previa de enlace externo" onClick={addLinkPreview}>
        {busy ? "…" : "🌐"}
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: false }),
      Image,
      LinkPreviewCard,
      Placeholder.configure({ placeholder: placeholder ?? "Escribe el contenido del artículo…" }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose-article prose prose-slate dark:prose-invert max-w-none min-h-[300px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return <div className="card min-h-[360px] animate-pulse" />;
  }

  return (
    <div className="card overflow-hidden">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

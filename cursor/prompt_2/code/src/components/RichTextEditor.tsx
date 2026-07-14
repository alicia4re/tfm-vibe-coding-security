"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useState } from "react";
import { Button } from "./ui";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escribe tu artículo aquí...",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-indigo-600 underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none min-h-[200px] px-4 py-3 focus:outline-none",
      },
    },
  });

  const addLink = useCallback(async () => {
    if (!editor || !linkUrl) return;

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await res.json();
      const preview = data.preview;

      if (preview?.title) {
        const card = `<div class="link-preview-card" data-url="${linkUrl}">
          <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="block border rounded-lg p-4 my-2 hover:bg-gray-50">
            ${preview.image ? `<img src="${preview.image}" alt="" class="w-full h-32 object-cover rounded mb-2" />` : ""}
            <strong>${preview.title}</strong>
            ${preview.description ? `<p class="text-sm text-gray-500 mt-1">${preview.description}</p>` : ""}
          </a>
        </div>`;
        editor.chain().focus().insertContent(card).run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: linkUrl })
          .run();
      }
    } catch {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    } finally {
      setPreviewLoading(false);
      setLinkUrl("");
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-indigo-100 text-indigo-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrita"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Cursiva"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Título"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Cita"
        >
          &ldquo;
        </ToolbarButton>
        <div className="mx-1 h-5 w-px bg-gray-300" />
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          active={showLinkInput}
          title="Enlace"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageInput(!showImageInput)}
          active={showImageInput}
          title="Imagen"
        >
          🖼
        </ToolbarButton>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://ejemplo.com"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
          />
          <Button size="sm" onClick={addLink} loading={previewLoading}>
            Añadir
          </Button>
        </div>
      )}

      {showImageInput && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de la imagen"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
          />
          <Button size="sm" onClick={addImage}>
            Insertar
          </Button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

export function RichTextDisplay({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm sm:prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

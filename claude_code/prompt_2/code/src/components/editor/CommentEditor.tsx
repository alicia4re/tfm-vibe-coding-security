"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

export default function CommentEditor({
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
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribe un comentario…" }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm prose-slate dark:prose-invert max-w-none min-h-[80px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt("URL del enlace:");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  if (!editor) {
    return <div className="card min-h-[110px] animate-pulse" />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border p-1.5 bg-background/50">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-7 w-7 rounded text-sm font-semibold ${editor.isActive("bold") ? "bg-primary text-primary-foreground" : "hover:bg-border/70"}`}
        >
          N
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-7 w-7 rounded text-sm italic ${editor.isActive("italic") ? "bg-primary text-primary-foreground" : "hover:bg-border/70"}`}
        >
          C
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-7 w-7 rounded text-sm ${editor.isActive("bulletList") ? "bg-primary text-primary-foreground" : "hover:bg-border/70"}`}
        >
          •—
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          className={`h-7 w-7 rounded text-sm ${editor.isActive("link") ? "bg-primary text-primary-foreground" : "hover:bg-border/70"}`}
        >
          🔗
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

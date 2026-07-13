import { useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { fetchLinkPreview } from "@/lib/link-preview.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bold, Italic, List, Link2, Image as ImageIcon, Quote, Code, Heading2, Eye, PenLine } from "lucide-react";

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const preview = useServerFn(fetchLinkPreview);

  function surround(before: string, after = before) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = value.slice(s, e) || "texto";
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + sel.length);
    });
  }
  function insertAtCursor(text: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    onChange(value.slice(0, s) + text + value.slice(s));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + text.length, s + text.length);
    });
  }

  async function insertImage() {
    const url = window.prompt("URL de la imagen:");
    if (!url) return;
    insertAtCursor(`\n\n![Imagen](${url})\n\n`);
  }
  async function insertLink() {
    const url = window.prompt("URL del enlace:");
    if (!url) return;
    surround("[", `](${url})`);
  }
  async function insertPreview() {
    const url = window.prompt("URL para vista previa:");
    if (!url) return;
    const t = toast.loading("Obteniendo vista previa…");
    try {
      const res = await preview({ data: { url } });
      toast.dismiss(t);
      if (!res.ok) return toast.error("No se pudo obtener la vista previa");
      const md = `\n\n> **[${res.title}](${res.url})**${res.description ? `\n> \n> ${res.description}` : ""}${res.image ? `\n> \n> ![](${res.image})` : ""}\n\n`;
      insertAtCursor(md);
      toast.success("Vista previa insertada");
    } catch {
      toast.dismiss(t);
      toast.error("Error obteniendo la vista previa");
    }
  }

  const tools = [
    { icon: Heading2, action: () => surround("## ", ""), label: "Encabezado" },
    { icon: Bold, action: () => surround("**"), label: "Negrita" },
    { icon: Italic, action: () => surround("*"), label: "Cursiva" },
    { icon: List, action: () => surround("- ", ""), label: "Lista" },
    { icon: Quote, action: () => surround("> ", ""), label: "Cita" },
    { icon: Code, action: () => surround("`"), label: "Código" },
    { icon: Link2, action: insertLink, label: "Enlace" },
    { icon: ImageIcon, action: insertImage, label: "Imagen (URL)" },
  ];

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      <div className="flex items-center gap-1 border-b border-border p-1.5 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.action}
            title={t.label}
            className="p-1.5 rounded hover:bg-accent"
          >
            <t.icon className="w-4 h-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={insertPreview}
          className="ml-1 px-2 py-1 text-xs rounded hover:bg-accent border border-border"
          title="Insertar vista previa de un enlace"
        >
          + Vista previa de enlace
        </button>
        <div className="ml-auto flex text-xs">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-2.5 py-1 rounded flex items-center gap-1 ${tab === "write" ? "bg-accent" : "hover:bg-accent"}`}
          >
            <PenLine className="w-3.5 h-3.5" /> Escribir
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-2.5 py-1 rounded flex items-center gap-1 ${tab === "preview" ? "bg-accent" : "hover:bg-accent"}`}
          >
            <Eye className="w-3.5 h-3.5" /> Vista previa
          </button>
        </div>
      </div>
      {tab === "write" ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={20}
          placeholder="Escribe tu artículo en Markdown…"
          className="w-full px-4 py-3 bg-background focus:outline-none resize-y font-mono text-sm leading-relaxed"
        />
      ) : (
        <div
          className="prose-article p-6 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
        />
      )}
    </div>
  );
}

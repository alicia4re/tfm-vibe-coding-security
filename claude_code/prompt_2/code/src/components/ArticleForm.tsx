"use client";

import { useActionState, useState } from "react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";
import type { ActionState } from "@/lib/actions/auth";

export interface ArticleFormValues {
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  tags: string;
}

const emptyValues: ArticleFormValues = { title: "", content: "", excerpt: "", coverImage: "", tags: "" };

export default function ArticleForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  initialValues?: Partial<ArticleFormValues>;
  submitLabel: string;
}) {
  const values = { ...emptyValues, ...initialValues };
  const [state, formAction] = useActionState(action, {} as ActionState);
  const [content, setContent] = useState(values.content);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <FormAlert error={state.error} success={state.success} />

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={values.title}
          className="input"
          placeholder="Título del artículo"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium mb-1">
          Resumen (opcional)
        </label>
        <input
          id="excerpt"
          name="excerpt"
          type="text"
          maxLength={300}
          defaultValue={values.excerpt}
          className="input"
          placeholder="Breve descripción que aparecerá en el listado"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium mb-1">
            Imagen de portada (URL, opcional)
          </label>
          <input
            id="coverImage"
            name="coverImage"
            type="url"
            defaultValue={values.coverImage}
            className="input"
            placeholder="https://…"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1">
            Etiquetas (separadas por comas)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            defaultValue={values.tags}
            className="input"
            placeholder="tecnología, viajes, cocina"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenido</label>
        <input type="hidden" name="content" value={content} />
        <RichTextEditor content={values.content} onChange={setContent} />
      </div>

      <SubmitButton pendingText="Guardando…" className="btn btn-primary self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

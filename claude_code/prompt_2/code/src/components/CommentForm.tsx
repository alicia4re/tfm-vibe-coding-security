"use client";

import { useActionState, useState } from "react";
import { addCommentAction } from "@/lib/actions/articles";
import type { ActionState } from "@/lib/actions/auth";
import CommentEditor from "@/components/editor/CommentEditor";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";

const initialState: ActionState = {};

export default function CommentForm({ articleId }: { articleId: string }) {
  const action = addCommentAction.bind(null, articleId);
  const [state, formAction] = useActionState(action, initialState);
  const [content, setContent] = useState("");
  const [key, setKey] = useState(0);

  // Reset the editor once after a successful submission. Adjusting state
  // during render (guarded by comparing against the last-seen state) avoids
  // the extra render cycle a useEffect-based reset would cause.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success) {
      setContent("");
      setKey((k) => k + 1);
    }
  }

  return (
    <form
      action={(formData) => {
        formData.set("content", content);
        formAction(formData);
      }}
      className="flex flex-col gap-3"
    >
      <FormAlert error={state.error} success={state.success} />
      <CommentEditor key={key} content={content} onChange={setContent} />
      <SubmitButton pendingText="Publicando…" className="btn btn-primary self-start">
        Comentar
      </SubmitButton>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { resetPasswordAction, type ActionState } from "@/lib/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";

const initialState: ActionState = {};

export default function ResetForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} success={state.success} />
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <SubmitButton pendingText="Guardando…">Guardar nueva contraseña</SubmitButton>
    </form>
  );
}

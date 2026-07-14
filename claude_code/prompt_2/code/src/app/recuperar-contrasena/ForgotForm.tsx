"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ActionState } from "@/lib/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";

const initialState: ActionState = {};

export default function ForgotForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} success={state.success} />
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" placeholder="tu@email.com" />
      </div>
      <SubmitButton pendingText="Enviando…">Enviar enlace de recuperación</SubmitButton>
      {state.success && (
        <Link href="/buzon" className="btn btn-secondary w-full">
          Ver buzón de pruebas
        </Link>
      )}
    </form>
  );
}

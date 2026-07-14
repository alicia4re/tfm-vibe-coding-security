"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";

const initialState: ActionState = {};

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} success={state.success} />
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input id="email" name="email" type="email" required className="input" placeholder="tu@email.com" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className="input" placeholder="Tu contraseña" />
      </div>
      <SubmitButton pendingText="Entrando…">Iniciar sesión</SubmitButton>
    </form>
  );
}

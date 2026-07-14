"use client";

import { useActionState } from "react";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import FormAlert from "@/components/FormAlert";

const initialState: ActionState = {};

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormAlert error={state.error} success={state.success} />
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nombre
        </label>
        <input id="name" name="name" type="text" required className="input" placeholder="Tu nombre" />
      </div>
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
      <SubmitButton pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}

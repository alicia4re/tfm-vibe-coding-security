"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useToast } from "@/components/Toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { showError, showSuccess } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      showError("Las contraseñas no coinciden");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se ha podido restablecer la contraseña");
        return;
      }
      showSuccess("Contraseña actualizada. Ya puedes iniciar sesión.");
      router.push("/login");
    } catch {
      showError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        Enlace no válido. Solicita un nuevo enlace de restablecimiento.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nueva contraseña</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirmar contraseña
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Repite la contraseña"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Guardando..." : "Restablecer contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
            ✓
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

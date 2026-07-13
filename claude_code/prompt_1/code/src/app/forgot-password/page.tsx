"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function ForgotPasswordPage() {
  const { showError } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "No se ha podido procesar la solicitud");
        return;
      }
      setSent(true);
      setPreviewUrl(data.previewUrl ?? null);
    } catch {
      showError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
            ✓
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {sent ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu
                contraseña. El enlace caduca en 1 hora.
              </div>
              {previewUrl && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="mb-1 font-medium">Modo demo: no hay proveedor de email real configurado.</p>
                  <p>
                    Puedes ver el correo simulado aquí:{" "}
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      abrir vista previa del email
                    </a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}
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

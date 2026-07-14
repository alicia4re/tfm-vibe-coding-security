"use client";

import { useState } from "react";
import { regenerateApiTokenAction } from "@/lib/actions/profile";

export default function ApiTokenCard({ token, apiUrl }: { token: string; apiUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-lg mb-1">Token de API</h2>
        <p className="text-sm text-muted">
          Úsalo para consultar el endpoint público de solo lectura con los artículos publicados.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <code className="input font-mono text-xs sm:text-sm overflow-x-auto whitespace-nowrap flex-1">{token}</code>
        <button type="button" onClick={copy} className="btn btn-secondary shrink-0">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <form
        action={async () => {
          setPending(true);
          await regenerateApiTokenAction();
          setPending(false);
        }}
      >
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? "Generando…" : "Regenerar token"}
        </button>
      </form>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-medium mb-2">Ejemplo de uso</p>
        <pre className="bg-background border border-border rounded-lg p-3 text-xs overflow-x-auto">
{`curl "${apiUrl}" \\
  -H "Authorization: Bearer ${token}"`}
        </pre>
      </div>
    </div>
  );
}

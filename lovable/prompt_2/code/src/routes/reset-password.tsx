import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({ meta: [{ title: "Nueva contraseña — Prisma" }] }),
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="border border-border rounded-lg p-8 bg-card">
        <h1 className="text-2xl font-serif font-semibold mb-4">Elige una nueva contraseña</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Nueva contraseña"
          />
          <button
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </form>
      </div>
    </div>
  );
}

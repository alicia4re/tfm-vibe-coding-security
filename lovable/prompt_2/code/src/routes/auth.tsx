import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — Prisma" }] }),
});

function AuthPage() {
  const { mode = "signin", redirect } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido!");
        navigate({ to: redirect ?? "/dashboard" });
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Ya puedes escribir tu primer artículo.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Te enviamos un email con instrucciones");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="border border-border rounded-lg p-6 sm:p-8 bg-card">
        <h1 className="text-2xl font-serif font-semibold mb-1">
          {mode === "signin" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signup"
            ? "El primer usuario registrado será editor. Los demás empiezan como lectores."
            : mode === "forgot"
            ? "Introduce tu email y te enviaremos un enlace."
            : "Accede a tu cuenta."}
        </p>

        <form onSubmit={handle} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre visible</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ada Lovelace"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="tu@email.com"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Cargando…" : mode === "signin" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-sm space-y-2 text-center">
          {mode === "signin" && (
            <>
              <div>
                ¿No tienes cuenta?{" "}
                <Link to="/auth" search={{ mode: "signup" }} className="text-primary hover:underline">
                  Crear una
                </Link>
              </div>
              <div>
                <Link to="/auth" search={{ mode: "forgot" }} className="text-muted-foreground hover:text-primary hover:underline">
                  Olvidé mi contraseña
                </Link>
              </div>
            </>
          )}
          {mode === "signup" && (
            <div>
              ¿Ya tienes cuenta?{" "}
              <Link to="/auth" search={{ mode: "signin" }} className="text-primary hover:underline">
                Entrar
              </Link>
            </div>
          )}
          {mode === "forgot" && (
            <div>
              <Link to="/auth" search={{ mode: "signin" }} className="text-primary hover:underline">
                Volver a entrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

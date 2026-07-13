import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PenSquare, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

export function AuthHeader() {
  const { user, displayName, isAuthor, isEditor } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
          <span className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">P</span>
          Prisma
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {isAuthor && (
                <Link
                  to="/editor/$id"
                  params={{ id: "new" }}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
                >
                  <PenSquare className="w-4 h-4" /> Escribir
                </Link>
              )}
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              >
                <LayoutDashboard className="w-4 h-4" /> Panel
              </Link>
              {isEditor && (
                <Link
                  to="/review"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <ShieldCheck className="w-4 h-4" /> Revisión
                </Link>
              )}
              <span className="hidden md:inline text-sm text-muted-foreground pl-2 pr-1">{displayName}</span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

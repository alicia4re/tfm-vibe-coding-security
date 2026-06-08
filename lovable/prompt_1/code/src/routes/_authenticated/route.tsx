import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LayoutDashboard, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session, loading, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (profile && profile.active === false) {
      signOut().then(() => navigate({ to: "/auth", replace: true }));
    }
  }, [profile, signOut, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { to: "/dashboard", label: "Mis tareas", icon: LayoutDashboard },
    ...(role === "admin" ? [{ to: "/admin", label: "Administración", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">TaskFlow</span>
            </Link>
            <nav className="hidden gap-1 md:flex">
              {navItems.map((it) => {
                const Icon = it.icon;
                const active = pathname === it.to;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.display_name ?? session.user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{role === "admin" ? "Administrador" : "Usuario"}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate({ to: "/auth", replace: true }))} title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {open && (
          <div className="border-t md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {navItems.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                    <Icon className="h-4 w-4" /> {it.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import MobileNav from "./MobileNav";

export default async function Header() {
  const user = await getCurrentUser();

  const navLinkClass =
    "px-3 py-1.5 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-border/60 transition-colors";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg tracking-tight shrink-0">
          Multiblog
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link href="/" className={navLinkClass}>
            Artículos
          </Link>
          {user && (user.role === "AUTHOR" || user.role === "EDITOR") && (
            <Link href="/panel" className={navLinkClass}>
              Panel
            </Link>
          )}
          {user && (
            <Link href="/perfil" className={navLinkClass}>
              Perfil
            </Link>
          )}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted">
                {user.name} <span className="text-xs">· {ROLE_LABELS[user.role]}</span>
              </span>
              <form action={logoutAction}>
                <button type="submit" className="btn btn-secondary">
                  Cerrar sesión
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/iniciar-sesion" className="btn btn-secondary">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn btn-primary">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <MobileNav>
          <Link href="/" className="px-2 py-2 rounded-md hover:bg-border/60">
            Artículos
          </Link>
          {user && (user.role === "AUTHOR" || user.role === "EDITOR") && (
            <Link href="/panel" className="px-2 py-2 rounded-md hover:bg-border/60">
              Panel
            </Link>
          )}
          {user && (
            <Link href="/perfil" className="px-2 py-2 rounded-md hover:bg-border/60">
              Perfil
            </Link>
          )}
          {user ? (
            <form action={logoutAction} className="mt-2">
              <button type="submit" className="btn btn-secondary w-full">
                Cerrar sesión ({user.name})
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Link href="/iniciar-sesion" className="btn btn-secondary w-full">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="btn btn-primary w-full">
                Registrarse
              </Link>
            </div>
          )}
        </MobileNav>
      </div>
    </header>
  );
}

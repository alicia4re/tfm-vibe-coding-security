"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import type { CurrentUser } from "@/lib/useUser";

export default function Navbar({ user }: { user: CurrentUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              ✓
            </span>
            <span className="hidden sm:inline">Gestión de Tareas</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Mis tareas
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin" className={linkClass("/admin")}>
                Administración
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">
              {user.role === "ADMIN" ? "Administrador" : "Usuario"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {loggingOut ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>
      </div>
    </header>
  );
}

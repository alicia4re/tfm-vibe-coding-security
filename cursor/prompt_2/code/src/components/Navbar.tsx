"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { Button, RoleBadge } from "./ui";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">BlogHub</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm text-gray-600 hover:text-indigo-600 sm:block"
          >
            Artículos
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Panel
              </Link>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-sm text-gray-500">{user.name}</span>
                <RoleBadge role={user.role} />
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

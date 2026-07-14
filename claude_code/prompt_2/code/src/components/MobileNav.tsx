"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border"
      >
        <span className="sr-only">Menú</span>
        <div className="flex flex-col gap-1">
          <span className="block w-5 h-0.5 bg-foreground" />
          <span className="block w-5 h-0.5 bg-foreground" />
          <span className="block w-5 h-0.5 bg-foreground" />
        </div>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-64 bg-surface border-l border-border p-4 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <Link href="/" className="font-bold text-lg" onClick={() => setOpen(false)}>
                Multiblog
              </Link>
              <button aria-label="Cerrar menú" onClick={() => setOpen(false)} className="h-8 w-8">
                ✕
              </button>
            </div>
            <div onClick={() => setOpen(false)} className="flex flex-col gap-1">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

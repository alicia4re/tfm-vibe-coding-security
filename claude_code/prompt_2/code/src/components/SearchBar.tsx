"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const router = useRouter();
  const pathname = usePathname();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por título, contenido o etiqueta…"
        className="input"
        aria-label="Buscar artículos"
      />
      <button type="submit" className="btn btn-primary shrink-0">
        Buscar
      </button>
    </form>
  );
}

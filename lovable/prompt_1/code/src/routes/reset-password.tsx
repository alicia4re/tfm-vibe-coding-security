import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPwd });

function ResetPwd() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = z.string().min(6, "Mínimo 6 caracteres").max(72).safeParse(fd.get("password"));
    if (!pw.success) return toast.error(pw.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">Establece una contraseña segura para tu cuenta.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">Nueva contraseña</Label>
            <Input id="np" name="password" type="password" required minLength={6} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

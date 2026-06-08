import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPwd });

function ForgotPwd() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = z.string().trim().email("Email inválido").safeParse(fd.get("email"));
    if (!email.success) return toast.error(email.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Email enviado");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-muted-foreground">Te enviaremos un enlace para crear una nueva contraseña.</p>
        {sent ? (
          <div className="mt-6 rounded-lg bg-success/10 p-4 text-sm text-success-foreground">
            <p className="font-medium text-foreground">Revisa tu correo electrónico.</p>
            <p className="mt-1 text-muted-foreground">Si la cuenta existe, recibirás un email con las instrucciones.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input id="fp-email" name="email" type="email" required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}
        <div className="mt-4 text-center text-sm">
          <Link to="/auth" className="text-primary hover:underline">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}

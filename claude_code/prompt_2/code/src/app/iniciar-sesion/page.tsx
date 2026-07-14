import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "./LoginForm";

export const metadata = { title: "Iniciar sesión — Multiblog" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const params = await searchParams;

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Iniciar sesión</h1>
        <p className="text-sm text-muted mb-6">Accede a tu cuenta para leer, escribir o editar artículos.</p>
        {params.reset === "ok" && (
          <div className="alert alert-success mb-4">Contraseña actualizada. Ya puedes iniciar sesión.</div>
        )}
        <LoginForm />
        <div className="flex justify-between items-center mt-4 text-sm">
          <Link href="/recuperar-contrasena" className="text-primary font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <p className="text-sm text-muted mt-6 text-center">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-primary font-medium">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

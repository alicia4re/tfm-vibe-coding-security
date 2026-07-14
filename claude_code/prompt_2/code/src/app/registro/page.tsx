import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Crear cuenta — Multiblog" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Crear cuenta</h1>
        <p className="text-sm text-muted mb-6">
          El primer usuario registrado se convierte automáticamente en editor.
        </p>
        <RegisterForm />
        <p className="text-sm text-muted mt-6 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href="/iniciar-sesion" className="text-primary font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

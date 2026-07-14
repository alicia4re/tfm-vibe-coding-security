import Link from "next/link";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Recuperar contraseña — Multiblog" };

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Recuperar contraseña</h1>
        <p className="text-sm text-muted mb-6">
          Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <ForgotForm />
        <p className="text-sm text-muted mt-6 text-center">
          <Link href="/iniciar-sesion" className="text-primary font-medium">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

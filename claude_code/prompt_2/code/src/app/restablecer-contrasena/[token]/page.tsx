import { prisma } from "@/lib/prisma";
import ResetForm from "./ResetForm";

export const metadata = { title: "Restablecer contraseña — Multiblog" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  const valid = !!resetToken && !resetToken.usedAt && resetToken.expiresAt > new Date();

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-1">Restablecer contraseña</h1>
        {valid ? (
          <>
            <p className="text-sm text-muted mb-6">Elige tu nueva contraseña.</p>
            <ResetForm token={token} />
          </>
        ) : (
          <div className="alert alert-error mt-4">
            Este enlace de recuperación no es válido o ha caducado. Solicita uno nuevo desde la página de recuperación
            de contraseña.
          </div>
        )}
      </div>
    </div>
  );
}

import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * No hay SMTP configurado en este entorno de pruebas local, así que los
 * emails se guardan en la base de datos y se pueden consultar en /buzon.
 * Sustituir por un proveedor real (Resend, SES, etc.) para producción.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  await prisma.emailLog.create({ data: { to, subject, html } });
  console.log(`[mailer] Email a ${to}: ${subject}`);
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Restablecer tu contraseña</h2>
      <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para elegir una nueva:</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;">Restablecer contraseña</a></p>
      <p>Si no solicitaste esto, puedes ignorar este mensaje. El enlace caduca en 1 hora.</p>
    </div>
  `;
}

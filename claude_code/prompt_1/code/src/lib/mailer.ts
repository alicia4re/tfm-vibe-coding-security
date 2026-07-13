import nodemailer, { type Transporter } from "nodemailer";

let transporterPromise: Promise<Transporter> | null = null;

// In development/demo we don't have real SMTP credentials, so we lazily
// create a free Ethereal test inbox on first use. Emails sent through it
// aren't really delivered — nodemailer returns a preview URL we log and
// surface to the caller instead.
async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        });
      }
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    })();
  }
  return transporterPromise;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: '"Gestión de Tareas" <no-reply@taskapp.local>',
    to,
    subject: "Recupera tu contraseña",
    text: `Has solicitado restablecer tu contraseña. Visita este enlace (válido 1 hora): ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Restablece tu contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Este enlace es válido durante 1 hora.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">Restablecer contraseña</a></p>
        <p>Si no solicitaste esto, puedes ignorar este correo.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  if (previewUrl) {
    console.log(`[mailer] Password reset email preview: ${previewUrl}`);
  }
  return { previewUrl };
}

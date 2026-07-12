import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const hasSmtp =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtp) {
    console.log("\n========================================");
    console.log("RECUPERACIÓN DE CONTRASEÑA (modo desarrollo)");
    console.log(`Usuario: ${email}`);
    console.log(`Enlace: ${resetUrl}`);
    console.log("========================================\n");
    return { devMode: true, resetUrl };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@taskmanager.local",
    to: email,
    subject: "Recuperación de contraseña - Task Manager",
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este enlace expira en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este mensaje.</p>
    `,
  });

  return { devMode: false };
}

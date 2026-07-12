const nodemailer = require('nodemailer');

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const subject = 'Recuperacion de contrasena - Task Manager';
  const text = `Has solicitado restablecer tu contrasena.\n\nAbre este enlace (valido 1 hora) para elegir una nueva:\n${resetUrl}\n\nSi no has sido tu, ignora este mensaje.`;
  const html = `
    <p>Has solicitado restablecer tu contrasena.</p>
    <p><a href="${resetUrl}">Haz clic aqui para elegir una nueva contrasena</a> (enlace valido durante 1 hora).</p>
    <p>Si no has sido tu, puedes ignorar este mensaje.</p>
  `;

  if (!transporter) {
    // Modo desarrollo: no hay SMTP configurado. Registramos el enlace en el
    // log del servidor para poder completar el flujo manualmente en pruebas.
    console.log('\n[mailer] SMTP no configurado - modo desarrollo.');
    console.log(`[mailer] Email de recuperacion para ${toEmail}:`);
    console.log(`[mailer] ${resetUrl}\n`);
    return { devMode: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"Task Manager" <no-reply@taskmanager.local>',
    to: toEmail,
    subject,
    text,
    html,
  });
  return { devMode: false };
}

module.exports = { sendPasswordResetEmail, smtpConfigured };

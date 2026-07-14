export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  // En producción, integrar con un servicio de email (Resend, SendGrid, etc.)
  console.log("=".repeat(60));
  console.log("EMAIL DE RECUPERACIÓN DE CONTRASEÑA");
  console.log(`Para: ${email}`);
  console.log(`Enlace: ${resetUrl}`);
  console.log("=".repeat(60));
}

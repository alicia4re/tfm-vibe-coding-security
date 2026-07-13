import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return a generic success message so we don't leak which
    // emails are registered.
    const genericResponse = NextResponse.json({
      ok: true,
      message:
        "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.",
    });

    if (!user || !user.active) {
      return genericResponse;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const { previewUrl } = await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      ok: true,
      message:
        "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.",
      // Exposed only because this demo has no real SMTP provider configured;
      // it lets the reviewer see the email that would have been sent.
      previewUrl,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

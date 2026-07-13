import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (
      !resetToken ||
      resetToken.used ||
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "El enlace de restablecimiento no es válido o ha caducado" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (error) {
    return errorResponse(error);
  }
}

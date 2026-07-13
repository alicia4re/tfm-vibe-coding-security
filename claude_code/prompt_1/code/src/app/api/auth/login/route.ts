import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Tu cuenta ha sido desactivada. Contacta con un administrador." },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    await setSessionCookie({ userId: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

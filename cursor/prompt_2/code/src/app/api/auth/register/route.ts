import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import type { Role } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "EDITOR" : "READER";

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        apiToken: nanoid(32),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = await createToken({ ...user, role: user.role as Role });
    await setSessionCookie(token);

    return NextResponse.json({
      message: "Usuario registrado correctamente",
      user,
      isFirstUser: userCount === 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}

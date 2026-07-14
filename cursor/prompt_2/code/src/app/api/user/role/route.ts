import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { role, userId } = body;
  if (!["READER", "AUTHOR", "EDITOR"].includes(role)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  if (user.role !== "EDITOR") {
    return NextResponse.json(
      { error: "Solo los editores pueden cambiar roles" },
      { status: 403 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: "ID de usuario obligatorio" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json({
    message: "Rol actualizado",
    user: updated,
  });
}

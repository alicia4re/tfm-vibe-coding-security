import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";

const patchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const data = patchSchema.parse(await req.json());

    if (id === admin.id) {
      if (data.role && data.role !== "ADMIN") {
        return NextResponse.json(
          { error: "No puedes cambiar tu propio rol de administrador" },
          { status: 400 }
        );
      }
      if (data.active === false) {
        return NextResponse.json(
          { error: "No puedes desactivar tu propia cuenta" },
          { status: 400 }
        );
      }
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}

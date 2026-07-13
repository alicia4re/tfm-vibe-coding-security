import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}

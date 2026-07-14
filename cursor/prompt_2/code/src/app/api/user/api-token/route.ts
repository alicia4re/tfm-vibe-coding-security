import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { apiToken: true },
  });

  return NextResponse.json({ apiToken: dbUser?.apiToken });
}

export async function POST() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const newToken = nanoid(32);
  await prisma.user.update({
    where: { id: user.id },
    data: { apiToken: newToken },
  });

  return NextResponse.json({
    message: "Token de API regenerado",
    apiToken: newToken,
  });
}

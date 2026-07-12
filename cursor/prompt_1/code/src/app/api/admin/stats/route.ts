import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const [tasksByStatus, activeUsers, totalUsers, totalTasks] = await Promise.all([
      prisma.task.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.user.findMany({
        where: { active: true },
        select: {
          id: true,
          email: true,
          name: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { tasks: { _count: "desc" } },
        take: 5,
      }),
      prisma.user.count(),
      prisma.task.count(),
    ]);

    const statusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    for (const item of tasksByStatus) {
      statusCounts[item.status] = item._count.status;
    }

    return NextResponse.json({
      statusCounts,
      activeUsers,
      totalUsers,
      totalTasks,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

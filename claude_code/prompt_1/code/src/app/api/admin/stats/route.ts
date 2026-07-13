import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();

    const [byStatus, byPriority, totalUsers, totalTasks, activeUsers, topUsers] =
      await Promise.all([
        prisma.task.groupBy({ by: ["status"], _count: { status: true } }),
        prisma.task.groupBy({ by: ["priority"], _count: { priority: true } }),
        prisma.user.count(),
        prisma.task.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            _count: { select: { tasks: true } },
          },
          orderBy: { tasks: { _count: "desc" } },
          take: 5,
        }),
      ]);

    const statusCounts = { PENDING: 0, IN_PROGRESS: 0, DONE: 0 } as Record<string, number>;
    for (const row of byStatus) statusCounts[row.status] = row._count.status;

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>;
    for (const row of byPriority) priorityCounts[row.priority] = row._count.priority;

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalTasks,
      statusCounts,
      priorityCounts,
      mostActiveUsers: topUsers
        .filter((u) => u._count.tasks > 0)
        .map((u) => ({ id: u.id, name: u.name, email: u.email, taskCount: u._count.tasks })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

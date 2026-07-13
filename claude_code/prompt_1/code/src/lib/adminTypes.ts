export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  active: boolean;
  createdAt: string;
  _count: { tasks: number };
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  mostActiveUsers: { id: string; name: string; email: string; taskCount: number }[];
};

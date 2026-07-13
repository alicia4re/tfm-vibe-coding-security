export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type Status = "PENDING" | "IN_PROGRESS" | "DONE";

export type Task = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  dueDate: string | null;
  priority: Priority;
  status: Status;
  ownerId: string;
  owner: { id: string; name: string; email: string };
  attachmentName: string | null;
  attachmentPath: string | null;
  attachmentType: string | null;
  attachmentSize: number | null;
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
};

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En curso",
  DONE: "Completada",
};

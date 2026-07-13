import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().trim().email("Email no válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email no válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email no válido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const STATUSES = ["PENDING", "IN_PROGRESS", "DONE"] as const;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  dueDate: z.string().trim().optional().nullable(),
  priority: z.enum(PRIORITIES).optional().default("MEDIUM"),
  status: z.enum(STATUSES).optional().default("PENDING"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const updateUserActiveSchema = z.object({
  active: z.boolean(),
});

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
];

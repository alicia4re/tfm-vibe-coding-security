"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { sendEmail, passwordResetEmailHtml } from "@/lib/mailer";

export interface ActionState {
  error?: string;
  success?: string;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  email: z.string().trim().toLowerCase().email("Introduce un email válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export async function registerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ya existe una cuenta con ese email" };
  }

  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "EDITOR" : "READER";

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, apiToken: nanoid(40) },
  });

  await setSessionCookie(user.id);
  redirect("/");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Introduce un email válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email o contraseña incorrectos" };
  }

  await setSessionCookie(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Introduce un email válido"),
});

export async function forgotPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const genericSuccess: ActionState = {
    success:
      "Si existe una cuenta con ese email, se ha enviado un enlace de recuperación. Consulta el buzón de pruebas en /buzon.",
  };

  if (!user) return genericSuccess;

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: user.id },
  });

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/restablecer-contrasena/${token}`;
  await sendEmail(user.email, "Restablecer tu contraseña", passwordResetEmailHtml(resetUrl));

  return genericSuccess;
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export async function resetPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { token, password } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "El enlace de recuperación no es válido o ha caducado" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/iniciar-sesion?reset=ok");
}

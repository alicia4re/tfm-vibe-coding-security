import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getUserFromApiToken(
  apiToken: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { apiToken },
    select: { id: true, email: true, name: true, role: true },
  });
  return user ? { ...user, role: user.role as import("@/types").Role } : null;
}

export function canEditArticle(
  user: SessionUser,
  authorId: string
): boolean {
  return user.role === "EDITOR" || user.id === authorId;
}

export function canViewArticle(
  user: SessionUser | null,
  article: { status: string; authorId: string }
): boolean {
  if (article.status === "PUBLISHED") return true;
  if (!user) return false;
  return user.role === "EDITOR" || user.id === article.authorId;
}

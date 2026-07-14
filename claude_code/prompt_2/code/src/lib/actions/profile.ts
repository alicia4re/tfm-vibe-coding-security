"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function regenerateApiTokenAction(): Promise<void> {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { apiToken: nanoid(40) } });
  revalidatePath("/perfil");
}

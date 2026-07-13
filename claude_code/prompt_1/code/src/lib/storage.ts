import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveAttachment(taskId: string, file: File) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).slice(0, 10);
  const safeName = `${taskId}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return { storedName: safeName, filePath };
}

export async function deleteAttachmentFile(storedName: string) {
  const filePath = path.join(UPLOAD_DIR, storedName);
  try {
    await unlink(filePath);
  } catch {
    // ignore if already missing
  }
}

export function attachmentAbsolutePath(storedName: string) {
  return path.join(UPLOAD_DIR, storedName);
}

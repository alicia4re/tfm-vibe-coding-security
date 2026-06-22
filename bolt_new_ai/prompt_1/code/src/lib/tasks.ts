import { supabase } from './supabase';
import type { Task, TaskPriority, TaskStatus } from '../types';

const BUCKET = 'task-attachments';
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface TaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
}

export function buildPath(userId: string, taskId: string, fileName: string) {
  return `${userId}/${taskId}/${fileName}`;
}

export async function fetchMyTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as Task[]) ?? [];
}

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, profiles:profiles!tasks_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Task[]) ?? [];
}

export async function createTask(input: TaskInput, userId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title: input.title, description: input.description ?? '', priority: input.priority, status: input.status, due_date: input.due_date ?? null, user_id: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const path = `${userId}/${id}`;
  const { data: list } = await supabase.storage.from(BUCKET).list(`${userId}/${id}`);
  if (list && list.length > 0) {
    const files = list.map((f) => `${path}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(files);
  }
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return 'El archivo supera el máximo de 5 MB.';
  const okTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
  if (!okTypes.includes(file.type)) return 'Solo se permiten imágenes o PDF.';
  return null;
}

export async function uploadAttachment(userId: string, taskId: string, file: File): Promise<string> {
  const path = `${userId}/${taskId}/${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function setAttachmentMeta(taskId: string, path: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ attachment_path: path, attachment_name: name })
    .eq('id', taskId);
  if (error) throw error;
}

export async function getAttachmentUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function removeAttachment(taskId: string, path: string): Promise<void> {
  const prefix = path.split('/').slice(0, -1).join('/');
  const fileName = path.split('/').pop();
  if (prefix && fileName) {
    await supabase.storage.from(BUCKET).remove([`${prefix}/${fileName}`]);
  }
  const { error } = await supabase
    .from('tasks')
    .update({ attachment_path: null, attachment_name: null })
    .eq('id', taskId);
  if (error) throw error;
}

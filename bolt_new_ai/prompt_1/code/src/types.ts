export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  full_name: string | null;
  created_at: string;
}

export type TaskPriority = 'baja' | 'media' | 'alta';
export type TaskStatus = 'pendiente' | 'en_curso' | 'completada';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  user_id: string;
  attachment_path: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface TaskWithProfile extends Task {
  profiles?: Pick<Profile, 'email' | 'full_name'> | null;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  completada: 'Completada',
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con este email.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('.email')) return 'El email no es válido.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos.';
  if (m.includes('network')) return 'Error de conexión. Revisa tu internet.';
  return message;
}

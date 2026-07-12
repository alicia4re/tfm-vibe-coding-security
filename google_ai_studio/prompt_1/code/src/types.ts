/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type TaskPriority = 'baja' | 'media' | 'alta';
export type TaskStatus = 'pendiente' | 'en curso' | 'completada';

export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  userId: string;
  userEmail: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AdminStats {
  totalTasks: number;
  tasksByStatus: {
    pendiente: number;
    enCurso: number;
    completada: number;
  };
  tasksByPriority: {
    baja: number;
    media: number;
    alta: number;
  };
  activeUsers: {
    userId: string;
    email: string;
    taskCount: number;
    role: UserRole;
  }[];
}

import { User, Task, AdminStats, AuthResponse } from "./types";

const API_BASE = ""; // Relative paths since frontend and backend run on same host/port

// Retrieve stored credentials
export function getStoredToken(): string | null {
  return localStorage.getItem("task_auth_token");
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem("task_auth_user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Store credentials
export function setStoredCredentials(token: string, user: User) {
  localStorage.setItem("task_auth_token", token);
  localStorage.setItem("task_auth_user", JSON.stringify(user));
}

// Clear credentials
export function clearStoredCredentials() {
  localStorage.removeItem("task_auth_token");
  localStorage.removeItem("task_auth_user");
}

// Custom Fetch Wrapper
async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Only set Content-Type to JSON if it's not a FormData request
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Algo salió mal. Por favor, inténtelo de nuevo.");
  }

  return data;
}

/* ================= AUTHENTICATION ENDPOINTS ================= */

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiRequest(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setStoredCredentials(data.token, data.user);
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse & { message: string }> {
  const data = await apiRequest(`${API_BASE}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setStoredCredentials(data.token, data.user);
  return data;
}

export async function recoverPassword(email: string): Promise<{ message: string; resetCode?: string; simulatedMail?: any }> {
  return apiRequest(`${API_BASE}/api/auth/recover-password`, {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword })
  });
}

/* ================= TASK MANAGEMENT ENDPOINTS ================= */

export async function getTasks(filters: { status?: string; priority?: string; search?: string } = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.search) params.set("search", filters.search);

  const query = params.toString();
  const url = `${API_BASE}/api/tasks${query ? `?${query}` : ""}`;
  return apiRequest(url, { method: "GET" });
}

export async function createTask(formData: FormData): Promise<{ task: Task; message: string }> {
  return apiRequest(`${API_BASE}/api/tasks`, {
    method: "POST",
    body: formData
  });
}

export async function updateTask(taskId: string, formData: FormData): Promise<{ task: Task; message: string }> {
  return apiRequest(`${API_BASE}/api/tasks/${taskId}`, {
    method: "PUT",
    body: formData
  });
}

export async function deleteTask(taskId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`${API_BASE}/api/tasks/${taskId}`, {
    method: "DELETE"
  });
}

/* ================= USER MANAGEMENT ENDPOINTS ================= */

export async function getUsers(): Promise<User[]> {
  return apiRequest(`${API_BASE}/api/users`, { method: "GET" });
}

export async function changeUserRole(userId: string, role: "admin" | "user"): Promise<{ user: User; message: string }> {
  return apiRequest(`${API_BASE}/api/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export async function toggleUserStatus(userId: string, status: "active" | "inactive"): Promise<{ user: User; message: string }> {
  return apiRequest(`${API_BASE}/api/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function getStats(): Promise<AdminStats> {
  return apiRequest(`${API_BASE}/api/stats`, { method: "GET" });
}

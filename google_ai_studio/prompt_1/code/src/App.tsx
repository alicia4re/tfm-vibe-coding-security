import React, { useState, useEffect } from "react";
import { User, Task, TaskStatus, TaskPriority } from "./types";
import { 
  getStoredUser, 
  getStoredToken, 
  clearStoredCredentials, 
  login, 
  register, 
  recoverPassword, 
  resetPassword,
  getTasks,
  deleteTask,
  createTask,
  updateTask
} from "./api";
import TaskCard from "./components/TaskCard";
import TaskModal from "./components/TaskModal";
import AdminUsers from "./components/AdminUsers";
import AdminStatsView from "./components/AdminStatsView";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon, 
  Plus, 
  Filter, 
  X, 
  Search, 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  Lock, 
  Mail, 
  Info,
  KeyRound,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "recover" | "reset-password">("login");
  
  // Auth Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Simulated inbox notification (for password recovery simulation)
  const [simulatedInbox, setSimulatedInbox] = useState<{ to: string; subject: string; body: string; code: string } | null>(null);

  // App UI State
  const [activeTab, setActiveTab] = useState<"my-tasks" | "all-tasks" | "users" | "stats">("my-tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState("");
  
  // Task filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Feedback
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Initialize auth
  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();
    if (user && token) {
      setCurrentUser(user);
      setAuthToken(token);
      // Default admin to statistics or all-tasks if admin, my-tasks if normal user
      if (user.role === "admin") {
        setActiveTab("all-tasks");
      } else {
        setActiveTab("my-tasks");
      }
    }
    setAuthReady(true);
  }, []);

  // Fetch tasks when user logged in or filters change
  const fetchTasksList = async () => {
    if (!currentUser) return;
    setLoadingTasks(true);
    setTasksError("");
    try {
      const data = await getTasks({
        status: filterStatus,
        priority: filterPriority,
        search: searchQuery
      });
      
      // If filtering "my-tasks" as an admin, we filter locally
      if (currentUser.role === "admin" && activeTab === "my-tasks") {
        setTasks(data.filter(t => t.userId === currentUser.id));
      } else {
        setTasks(data);
      }
    } catch (err: any) {
      setTasksError(err.message || "Error al recuperar la lista de tareas.");
      // If token expired, log out
      if (err.message?.includes("expired") || err.message?.includes("Token inválido")) {
        handleSignOut();
      }
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTasksList();
    }
  }, [currentUser, activeTab, filterStatus, filterPriority]);

  // Handle search with debounce/trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasksList();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    // Trigger list fetch instantly without query
    setTimeout(() => {
      fetchTasksList();
    }, 50);
  };

  /* ================= AUTH ACTIONS ================= */

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setApiError("Todos los campos son obligatorios.");
      return;
    }
    setSubmittingAuth(true);
    setApiError("");
    setSuccessMessage("");
    try {
      const res = await login(email, password);
      setCurrentUser(res.user);
      setAuthToken(res.token);
      setEmail("");
      setPassword("");
      setSuccessMessage("¡Sesión iniciada correctamente!");
      if (res.user.role === "admin") {
        setActiveTab("all-tasks");
      } else {
        setActiveTab("my-tasks");
      }
    } catch (err: any) {
      setApiError(err.message || "Error al iniciar sesión.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setApiError("Todos los campos son obligatorios.");
      return;
    }
    if (password.length < 6) {
      setApiError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setApiError("Las contraseñas no coinciden.");
      return;
    }
    setSubmittingAuth(true);
    setApiError("");
    setSuccessMessage("");
    try {
      const res = await register(email, password);
      setCurrentUser(res.user);
      setAuthToken(res.token);
      setSuccessMessage(res.message);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      if (res.user.role === "admin") {
        setActiveTab("all-tasks");
      } else {
        setActiveTab("my-tasks");
      }
    } catch (err: any) {
      setApiError(err.message || "Error al completar el registro.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handlePasswordRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setApiError("El email es obligatorio.");
      return;
    }
    setSubmittingAuth(true);
    setApiError("");
    setSuccessMessage("");
    try {
      const res = await recoverPassword(email);
      setSuccessMessage(res.message);
      
      // If we received a simulation code, pop up the simulated email box for test drive!
      if (res.resetCode) {
        setSimulatedInbox({
          to: email,
          subject: res.simulatedMail?.subject || "Restablecimiento de contraseña",
          body: res.simulatedMail?.body || `Tu código es ${res.resetCode}`,
          code: res.resetCode
        });
      }
      
      setAuthMode("reset-password");
      setNewPassword("");
      setRecoveryCode("");
    } catch (err: any) {
      setApiError(err.message || "Error al procesar la recuperación.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !recoveryCode || !newPassword) {
      setApiError("Todos los campos son obligatorios.");
      return;
    }
    if (newPassword.length < 6) {
      setApiError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmittingAuth(true);
    setApiError("");
    setSuccessMessage("");
    try {
      const res = await resetPassword(email, recoveryCode, newPassword);
      setSuccessMessage(res.message);
      setSimulatedInbox(null); // Clear simulated inbox on success
      setAuthMode("login");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setApiError(err.message || "Error al restablecer la contraseña.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSignOut = () => {
    clearStoredCredentials();
    setCurrentUser(null);
    setAuthToken(null);
    setTasks([]);
    setSuccessMessage("Sesión cerrada con éxito.");
    setSimulatedInbox(null);
    setApiError("");
  };

  /* ================= TASK ACTIONS ================= */

  const handleCreateOrUpdateTask = async (formData: FormData) => {
    setApiError("");
    setSuccessMessage("");
    try {
      if (editingTask) {
        const result = await updateTask(editingTask.id, formData);
        setSuccessMessage(result.message);
      } else {
        const result = await createTask(formData);
        setSuccessMessage(result.message);
      }
      fetchTasksList();
    } catch (err: any) {
      setApiError(err.message || "Error al guardar la tarea.");
      throw err; // throw to let modal handle loading state termination
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setApiError("");
    setSuccessMessage("");
    try {
      const result = await deleteTask(taskId);
      setSuccessMessage(result.message);
      fetchTasksList();
    } catch (err: any) {
      setApiError(err.message || "Error al eliminar la tarea.");
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Instantly reflect in local state for snappy UX
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const fd = new FormData();
      fd.append("status", newStatus);
      await updateTask(taskId, fd);
    } catch (err: any) {
      setApiError(err.message || "Error al cambiar el estado de la tarea.");
      // Rollback to database status if failed
      fetchTasksList();
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-500 mt-4">Iniciando Gestor de Tareas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 selection:bg-indigo-600/10 selection:text-indigo-600">
      
      {/* ================= MOCK EMAIL INBOX SIMULATOR BANNER ================= */}
      {simulatedInbox && (
        <div className="bg-amber-50 border-b border-amber-200 py-3.5 px-4 sm:px-6 relative shadow-xs animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex gap-2.5">
              <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>[Buzón de Simulación] Correo de Recuperación Recibido</span>
                  <span className="bg-amber-200 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">TESTING</span>
                </p>
                <p className="text-amber-800 mt-1">
                  <strong>Para:</strong> {simulatedInbox.to} | <strong>Asunto:</strong> {simulatedInbox.subject}
                </p>
                <p className="text-amber-900 font-mono mt-1 p-2 bg-amber-100/70 border border-amber-200 rounded-md">
                  {simulatedInbox.body}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={() => {
                  setRecoveryCode(simulatedInbox.code);
                  setSuccessMessage("Código copiado automáticamente al formulario.");
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1"
              >
                Autocompletar Código
              </button>
              <button
                onClick={() => setSimulatedInbox(null)}
                className="p-1 hover:bg-amber-200 rounded-lg text-amber-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= AUTHENTICATED HEADER ================= */}
      {currentUser && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-xs">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-md sm:text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-1">
                  Gestor de Tareas
                </h1>
                <p className="text-[10px] text-gray-400 font-medium">Panel de Control</p>
              </div>
            </div>

            {/* Right User Bar */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <p className="text-xs font-bold text-gray-800 leading-tight">{currentUser.email}</p>
                <span className={`self-end inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  currentUser.role === "admin" 
                    ? "bg-purple-100 text-purple-800 border border-purple-200" 
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}>
                  {currentUser.role === "admin" ? (
                    <>
                      <ShieldCheck className="w-2.5 h-2.5 text-purple-600" />
                      ADMIN
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-2.5 h-2.5 text-gray-500" />
                      Usuario
                    </>
                  )}
                </span>
              </div>

              {/* User Avatar Placeholder */}
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                {currentUser.email.substring(0, 2).toUpperCase()}
              </div>

              {/* Signout Button */}
              <button
                id="btn-signout"
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-gray-200 hover:border-rose-100"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ================= SUCCESS / ERROR ALERTS ================= */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 empty:hidden space-y-2">
        {successMessage && (
          <div className="p-3.5 bg-green-50 text-green-800 border border-green-100 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-green-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {apiError && (
          <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-100 text-xs font-semibold rounded-xl flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={() => setApiError("")} className="text-rose-600 hover:text-rose-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ================= UNAUTHENTICATED SCREENS ================= */}
        {!currentUser ? (
          <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            
            {/* Visual Identity inside Form */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md mb-3">
                <ClipboardList className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Gestor de Tareas
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">Organización y Gestión Profesional</p>
            </div>

            {/* Auth Mode Tabs */}
            {(authMode === "login" || authMode === "register") && (
              <div className="grid grid-cols-2 bg-gray-100 p-1.5 rounded-xl mb-6">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setApiError("");
                    setSuccessMessage("");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === "login"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setApiError("");
                    setSuccessMessage("");
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === "register"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Registrarse
                </button>
              </div>
            )}

            {/* ============ LOGIN SCREEN ============ */}
            {authMode === "login" && (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("recover");
                        setApiError("");
                        setSuccessMessage("");
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {submittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <span>Entrar al Sistema</span>
                  )}
                </button>
              </form>
            )}

            {/* ============ REGISTER SCREEN ============ */}
            {authMode === "register" && (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex gap-2 font-medium">
                  <Info className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>Nota: El primer usuario registrado en la base de datos se configurará como <strong>Administrador</strong> automáticamente.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {submittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Registrando...
                    </>
                  ) : (
                    <span>Registrar Cuenta</span>
                  )}
                </button>
              </form>
            )}

            {/* ============ RECOVER SCREEN ============ */}
            {authMode === "recover" && (
              <form onSubmit={handlePasswordRecoverySubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-950 text-sm">Recuperar Contraseña</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Te enviaremos un código de seguridad para restablecer tu cuenta de pruebas.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email de tu cuenta
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generando código...
                    </>
                  ) : (
                    <span className="flex items-center gap-1">Enviar Código de Recuperación <ArrowRight className="w-4 h-4" /></span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setApiError("");
                      setSuccessMessage("");
                    }}
                    className="text-xs text-gray-500 hover:text-indigo-600 font-bold"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </form>
            )}

            {/* ============ RESET PASSWORD WITH CODE ============ */}
            {authMode === "reset-password" && (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-950 text-sm">Restablecer Contraseña</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Usa el código recibido en el buzón simulado superior.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Código de Recuperación
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Código de 6 dígitos"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Restableciendo...
                    </>
                  ) : (
                    <span>Cambiar Contraseña</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setSimulatedInbox(null);
                      setApiError("");
                      setSuccessMessage("");
                    }}
                    className="text-xs text-gray-500 hover:text-indigo-600 font-bold"
                  >
                    Cancelar y volver al inicio
                  </button>
                </div>
              </form>
            )}

          </div>
        ) : (
          /* ================= AUTHENTICATED SYSTEM ================= */
          <div className="space-y-6">
            
            {/* Nav and Tab control */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-gray-200 pb-4">
              
              {/* Left Tabs */}
              <nav className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl self-start md:self-auto shrink-0">
                
                {currentUser.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("all-tasks")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "all-tasks"
                        ? "bg-white text-gray-900 shadow-xs"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Todas las Tareas</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("my-tasks")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === "my-tasks"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Mis Tareas</span>
                </button>

                {currentUser.role === "admin" && (
                  <>
                    <button
                      onClick={() => setActiveTab("users")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === "users"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Usuarios</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("stats")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        activeTab === "stats"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Estadísticas</span>
                    </button>
                  </>
                )}
              </nav>

              {/* Right Button Action */}
              {(activeTab === "my-tasks" || activeTab === "all-tasks") && (
                <button
                  id="btn-create-task"
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 self-end md:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Tarea</span>
                </button>
              )}
            </div>

            {/* ================= VIEW SWITCHER CONTENT ================= */}
            <AnimatePresence mode="wait">
              {/* TABS FOR TASKS */}
              {(activeTab === "my-tasks" || activeTab === "all-tasks") && (
                <motion.div
                  key={activeTab + "-view"}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Filters block */}
                  <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    
                    {/* Search */}
                    <div className="md:col-span-5">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Buscar por título o descripción
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Escribe palabras clave..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400 text-gray-700"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Status */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Filtrar por Estado
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-gray-700 capitalize"
                      >
                        <option value="">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en curso">En Curso</option>
                        <option value="completada">Completada</option>
                      </select>
                    </div>

                    {/* Filter Priority */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Filtrar por Prioridad
                      </label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-gray-700 capitalize"
                      >
                        <option value="">Todas las prioridades</option>
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>

                    {/* Filter Action Trigger Button */}
                    <div className="md:col-span-1">
                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        title="Buscar"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span className="md:hidden">Filtrar</span>
                      </button>
                    </div>

                  </form>

                  {/* Tasks Grid */}
                  {loadingTasks ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3.5"></div>
                      <p className="text-sm text-gray-500 font-medium">Recuperando listado de tareas...</p>
                    </div>
                  ) : tasksError ? (
                    <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-sm font-semibold max-w-lg mx-auto">
                      <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                      <p>{tasksError}</p>
                      <button
                        onClick={fetchTasksList}
                        className="mt-4 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl transition-all font-bold text-xs"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs max-w-md mx-auto">
                      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-base font-extrabold text-gray-900 tracking-tight">No hay tareas que mostrar</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                        No se ha encontrado ninguna tarea con los filtros seleccionados o la base de datos está vacía.
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        Crear mi primera tarea
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          currentUser={currentUser}
                          onEdit={openEditModal}
                          onDelete={handleDeleteTask}
                          onStatusChange={handleQuickStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB FOR USER ADMINISTRATION */}
              {activeTab === "users" && currentUser.role === "admin" && (
                <motion.div
                  key="users-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Administración de Usuarios</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Gestión de privilegios, roles y accesos.</p>
                  </div>
                  <AdminUsers currentUser={currentUser} />
                </motion.div>
              )}

              {/* TAB FOR ADMINISTRATOR STATISTICS */}
              {activeTab === "stats" && currentUser.role === "admin" && (
                <motion.div
                  key="stats-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Estadísticas Generales</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Indicadores clave de productividad y usuarios activos.</p>
                  </div>
                  <AdminStatsView />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} Gestor de Tareas. Desarrollado y compilado con tecnología full-stack.</p>
        </div>
      </footer>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        task={editingTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
      />

    </div>
  );
}

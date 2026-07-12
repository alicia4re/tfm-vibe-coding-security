import React, { useState, useEffect } from "react";
import { User } from "../types";
import { getUsers, changeUserRole, toggleUserStatus } from "../api";
import { Shield, ShieldAlert, CheckCircle, XCircle, Search, Calendar, RefreshCw, AlertTriangle, Check } from "lucide-react";

interface AdminUsersProps {
  currentUser: User;
}

export default function AdminUsers({ currentUser }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsersList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersList();
  }, []);

  const handleRoleToggle = async (userId: string, currentRole: "admin" | "user", email: string) => {
    const targetRole = currentRole === "admin" ? "user" : "admin";
    const confirmMsg = `¿Estás seguro de que deseas cambiar el rol de ${email} a ${targetRole.toUpperCase()}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setError("");
    setSuccess("");
    try {
      const result = await changeUserRole(userId, targetRole);
      setSuccess(result.message);
      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: result.user.role } : u))
      );
    } catch (err: any) {
      setError(err.message || "Error al cambiar el rol del usuario.");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: "active" | "inactive", email: string) => {
    const targetStatus = currentStatus === "active" ? "inactive" : "active";
    const confirmMsg = `¿Estás seguro de que deseas ${targetStatus === "active" ? "activar" : "desactivar"} la cuenta de ${email}?`;
    
    if (!window.confirm(confirmMsg)) return;

    setError("");
    setSuccess("");
    try {
      const result = await toggleUserStatus(userId, targetStatus);
      setSuccess(result.message);
      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: result.user.status } : u))
      );
    } catch (err: any) {
      setError(err.message || "Error al cambiar el estado del usuario.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="admin-users-panel" className="space-y-6">
      
      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-400"
          />
        </div>
        
        <button
          onClick={loadUsersList}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-indigo-100"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Lista</span>
        </button>
      </div>

      {/* Main Container */}
      {loading && users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-gray-500 font-medium">Cargando usuarios registrados...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden bg-white rounded-xl border border-gray-200 shadow-xs">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Rol del Sistema
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Estado de Cuenta
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Acciones de Gestión
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 italic">
                      No se encontraron usuarios registrados con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                              {user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="ml-3 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                                {user.email}
                              </p>
                              <p className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4.5 whitespace-nowrap text-xs text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {user.role === "admin" ? (
                              <>
                                <Shield className="w-3 h-3 text-purple-600" />
                                Administrador
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3 h-3 text-gray-500" />
                                Usuario Normal
                              </>
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {user.status === "active" ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                Activo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Desactivado
                              </>
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap text-right text-xs font-medium space-x-2">
                          {/* Toggle Role Button */}
                          <button
                            onClick={() => handleRoleToggle(user.id, user.role, user.email)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              user.role === "admin"
                                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                : "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"
                            }`}
                          >
                            {user.role === "admin" ? "Hacer Usuario" : "Hacer Admin"}
                          </button>

                          {/* Activate/Deactivate Button */}
                          <button
                            onClick={() => handleStatusToggle(user.id, user.status, user.email)}
                            disabled={isSelf}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              isSelf
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : user.status === "active"
                                ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                                : "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                            }`}
                            title={isSelf ? "No puedes desactivarte a ti mismo" : ""}
                          >
                            {user.status === "active" ? "Desactivar" : "Activar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 bg-white border border-gray-200 rounded-xl italic">
                No se encontraron usuarios registrados.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelf = user.id === currentUser.id;
                return (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-2.5 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.email}
                          </p>
                          <p className="text-[9px] text-gray-400 font-mono truncate">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100">
                      <div>
                        <p className="text-gray-400 font-medium">Registro</p>
                        <p className="text-gray-700 font-semibold">{formatDate(user.createdAt).split(",")[0]}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Rol</p>
                        <span className={`inline-flex items-center gap-1 font-semibold rounded-md text-[10px] uppercase tracking-wider`}>
                          {user.role === "admin" ? "ADMIN" : "USUARIO"}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1.5 flex items-center gap-2">
                        <p className="text-gray-400 font-medium shrink-0">Estado de cuenta:</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === "active" ? "bg-green-100 text-green-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {user.status === "active" ? "ACTIVO" : "INACTIVO"}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleRoleToggle(user.id, user.role, user.email)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border text-center ${
                          user.role === "admin"
                            ? "bg-white text-gray-700 border-gray-300"
                            : "bg-purple-50 text-purple-700 border-purple-100"
                        }`}
                      >
                        {user.role === "admin" ? "Quitar Admin" : "Hacer Admin"}
                      </button>

                      <button
                        onClick={() => handleStatusToggle(user.id, user.status, user.email)}
                        disabled={isSelf}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border text-center ${
                          isSelf
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : user.status === "active"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : "bg-green-50 text-green-700 border-green-100"
                        }`}
                      >
                        {user.status === "active" ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

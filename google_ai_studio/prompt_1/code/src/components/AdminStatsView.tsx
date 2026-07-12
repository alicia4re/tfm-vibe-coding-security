import React, { useState, useEffect } from "react";
import { AdminStats } from "../types";
import { getStats } from "../api";
import { BarChart3, Users, ClipboardList, CheckSquare, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminStatsView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Error al calcular las estadísticas de administración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Cargando métricas y estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-center text-rose-800 text-xs font-semibold">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
        <p>{error}</p>
        <button
          onClick={loadStats}
          className="mt-3 px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-colors font-bold"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Percentage calculations
  const total = stats.totalTasks || 0;
  
  const getPercentage = (value: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const statusPct = {
    pendiente: getPercentage(stats.tasksByStatus.pendiente),
    enCurso: getPercentage(stats.tasksByStatus.enCurso),
    completada: getPercentage(stats.tasksByStatus.completada)
  };

  const priorityPct = {
    baja: getPercentage(stats.tasksByPriority.baja),
    media: getPercentage(stats.tasksByPriority.media),
    alta: getPercentage(stats.tasksByPriority.alta)
  };

  return (
    <div id="admin-stats-view" className="space-y-6">
      
      {/* Upper Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={loadStats}
          disabled={loading}
          className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Grid: High-level KPI widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tareas</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendientes</p>
            <p className="text-3xl font-extrabold text-gray-700 mt-1">{stats.tasksByStatus.pendiente}</p>
          </div>
          <div className="h-12 w-12 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center border border-gray-200">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        {/* In-Progress Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Curso</p>
            <p className="text-3xl font-extrabold text-indigo-700 mt-1">{stats.tasksByStatus.enCurso}</p>
          </div>
          <div className="h-12 w-12 bg-indigo-50/50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completadas</p>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">{stats.tasksByStatus.completada}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Visual distributions & Active Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Distribution Progress bars */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              Distribución por Estado
            </h3>
            
            <div className="space-y-4">
              {/* Pendiente */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Pendiente</span>
                  <span>{stats.tasksByStatus.pendiente} ({statusPct.pendiente}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${statusPct.pendiente}%` }}></div>
                </div>
              </div>

              {/* En Curso */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>En Curso</span>
                  <span>{stats.tasksByStatus.enCurso} ({statusPct.enCurso}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${statusPct.enCurso}%` }}></div>
                </div>
              </div>

              {/* Completada */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Completada</span>
                  <span>{stats.tasksByStatus.completada} ({statusPct.completada}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${statusPct.completada}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              Distribución por Prioridad
            </h3>
            
            <div className="space-y-4">
              {/* Baja */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Baja</span>
                  <span>{stats.tasksByPriority.baja} ({priorityPct.baja}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${priorityPct.baja}%` }}></div>
                </div>
              </div>

              {/* Media */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Media</span>
                  <span>{stats.tasksByPriority.media} ({priorityPct.media}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${priorityPct.media}%` }}></div>
                </div>
              </div>

              {/* Alta */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Alta</span>
                  <span>{stats.tasksByPriority.alta} ({priorityPct.alta}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${priorityPct.alta}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Leaderboard (Users sorted by activity) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4 h-full flex flex-col">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Ranking de Usuarios más Activos
            </h3>

            <div className="flex-1 overflow-auto max-h-[350px]">
              <div className="divide-y divide-gray-100 min-w-full">
                {stats.activeUsers.length === 0 ? (
                  <p className="text-center py-10 text-sm text-gray-500 italic">No hay registros de usuarios activos.</p>
                ) : (
                  stats.activeUsers.map((user, idx) => (
                    <div key={user.userId} className="py-3 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Position badge */}
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          idx === 1 ? "bg-slate-100 text-slate-800 border border-slate-200" :
                          idx === 2 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-gray-50 text-gray-500"
                        }`}>
                          {idx + 1}
                        </div>
                        
                        {/* Avatar */}
                        <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[150px] sm:max-w-[200px]" title={user.email}>
                            {user.email}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            {user.role === "admin" && (
                              <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                                <ShieldCheck className="w-2.5 h-2.5" /> Administrador
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                          {user.taskCount} tareas
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

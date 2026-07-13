/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { Users, Shield, ArrowLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface UserManagementProps {
  onBack: () => void;
  currentUserProfile: UserProfile;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  onBack,
  currentUserProfile,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(list);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setErrorMsg('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetUid: string, newRole: UserRole) => {
    if (targetUid === currentUserProfile.uid) {
      setErrorMsg('No puedes cambiar tu propio rol de editor.');
      return;
    }

    setUpdatingId(targetUid);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: newRole });
      
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
      setSuccessMsg('Rol de usuario actualizado con éxito.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setErrorMsg('No tienes permisos suficientes o ocurrió un error al actualizar el rol.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-100 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Gestión de Roles de Usuario
          </h1>
          <p className="text-sm text-gray-500">
            Como Editor, puedes ascender o degradar usuarios para probar las diferentes funcionalidades.
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users List Container */}
      <div className="bg-white border border-gray-150/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Loader className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
            <span>Cargando lista de usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <span>No se encontraron usuarios registrados.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">ID Usuario</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Rol Actual</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Asignar Nuevo Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <span className="font-semibold text-gray-800 text-sm block">{user.email}</span>
                      {user.uid === currentUserProfile.uid && (
                        <span className="inline-block mt-0.5 text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                          Tú (Actual)
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-400 truncate max-w-[140px]" title={user.uid}>
                      {user.uid}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                        user.role === 'editor' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : user.role === 'autor'
                          ? 'bg-purple-50 text-purple-700 border-purple-150'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {updatingId === user.uid ? (
                        <span className="text-xs text-gray-400 flex items-center justify-end gap-1">
                          <Loader className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          Actualizando...
                        </span>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleRoleChange(user.uid, 'lector')}
                            disabled={user.uid === currentUserProfile.uid}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                              user.role === 'lector'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40'
                            }`}
                          >
                            Lector
                          </button>
                          <button
                            onClick={() => handleRoleChange(user.uid, 'autor')}
                            disabled={user.uid === currentUserProfile.uid}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                              user.role === 'autor'
                                ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40'
                            }`}
                          >
                            Autor
                          </button>
                          <button
                            onClick={() => handleRoleChange(user.uid, 'editor')}
                            disabled={user.uid === currentUserProfile.uid}
                            className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-all ${
                              user.role === 'editor'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40'
                            }`}
                          >
                            Editor
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role description card */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-150 rounded-xl">
          <span className="text-xs font-bold uppercase text-indigo-600 block mb-1">Lector</span>
          <p className="text-xs text-gray-500 leading-relaxed">
            Permisos básicos. Puede leer todos los artículos publicados en el blog y realizar comentarios. No tiene permisos de redacción.
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-150 rounded-xl">
          <span className="text-xs font-bold uppercase text-purple-600 block mb-1">Autor</span>
          <p className="text-xs text-gray-500 leading-relaxed">
            Permisos de redactor. Puede crear borradores, editarlos, adjuntar enlaces con previsualización, e imágenes. Envía a revisión de editores.
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-150 rounded-xl">
          <span className="text-xs font-bold uppercase text-emerald-600 block mb-1">Editor</span>
          <p className="text-xs text-gray-500 leading-relaxed">
            Control total de edición. Puede revisar borradores de cualquier autor, publicarlos o despublicarlos, moderar comentarios y gestionar roles.
          </p>
        </div>
      </div>
    </div>
  );
};

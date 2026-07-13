/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, LogOut, Key, User, PlusCircle, Users, Search } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenEditor: () => void;
  onOpenUserManagement: () => void;
  onOpenApiSettings: () => void;
  onHome: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  onOpenAuth,
  onLogout,
  onOpenEditor,
  onOpenUserManagement,
  onOpenApiSettings,
  onHome,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div 
            onClick={onHome}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-all shrink-0"
          >
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight block leading-none">Mesa Redonda</span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase">Blog Colaborativo</span>
            </div>
          </div>

          {/* Search bar - centered & fluid */}
          <div className="max-w-md w-full relative hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, contenido o etiqueta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {userProfile ? (
              <>
                {/* Desktop Badges and Extra Controls */}
                <div className="hidden lg:flex items-center gap-2 mr-2">
                  {userProfile.role === 'editor' && (
                    <button
                      onClick={onOpenUserManagement}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-all border border-gray-100"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Usuarios
                    </button>
                  )}

                  {(userProfile.role === 'autor' || userProfile.role === 'editor') && (
                    <button
                      onClick={onOpenEditor}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-100 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Nuevo Artículo
                    </button>
                  )}

                  <button
                    onClick={onOpenApiSettings}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-all border border-gray-100"
                  >
                    <Key className="w-3.5 h-3.5" />
                    API pública
                  </button>
                </div>

                {/* User Info Capsule */}
                <div className="flex items-center gap-2 pl-3 border-l border-gray-150 py-1">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-semibold text-gray-800 truncate max-w-[150px]">{userProfile.email}</div>
                    <div className="flex justify-end gap-1 items-center mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider border ${
                        userProfile.role === 'editor' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : userProfile.role === 'autor'
                          ? 'bg-purple-50 text-purple-700 border-purple-150'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                      }`}>
                        {userProfile.role}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-100 transition-all"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

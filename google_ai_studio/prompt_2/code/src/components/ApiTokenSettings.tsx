/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Key, ArrowLeft, RefreshCw, Copy, Check, Terminal, ExternalLink, Globe } from 'lucide-react';

interface ApiTokenSettingsProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onBack: () => void;
}

export const ApiTokenSettings: React.FC<ApiTokenSettingsProps> = ({
  userProfile,
  onUpdateProfile,
  onBack,
}) => {
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const generateApiToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(userProfile.apiToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotateToken = async () => {
    if (!window.confirm('¿Estás seguro de que deseas regenerar tu Token de API? Las aplicaciones que utilicen tu token actual perderán el acceso de inmediato.')) {
      return;
    }

    setRotating(true);
    try {
      const newToken = generateApiToken();
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, { apiToken: newToken });

      const updated = { ...userProfile, apiToken: newToken };
      onUpdateProfile(updated);
      setSuccessMsg('Token de API regenerado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Error al actualizar el token de API.');
    } finally {
      setRotating(false);
    }
  };

  const apiUrl = `${window.location.origin}/api/published-articles?api_token=${userProfile.apiToken}`;
  const curlExample = `curl -H "Authorization: Bearer ${userProfile.apiToken}" \\\n  "${window.location.origin}/api/published-articles"`;

  const responsePlaceholder = `{
  "user": {
    "email": "${userProfile.email}",
    "role": "${userProfile.role}"
  },
  "articles": [
    {
      "id": "abc123xyz",
      "title": "Mi primer artículo publicado",
      "content": "<p>Contenido del artículo...</p>",
      "authorName": "Escritor Estrella",
      "authorEmail": "autor@ejemplo.com",
      "tags": ["tecnologia", "desarrollo"],
      "linkPreviews": [],
      "createdAt": "2026-07-13T10:00:00.000Z"
    }
  ]
}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-100 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-600" />
            Configuración de API Pública
          </h1>
          <p className="text-sm text-gray-500">
            Obtén y gestiona tus credenciales para acceder a la API de lectura de artículos publicados de forma externa.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 mb-6 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Management Column */}
        <div className="lg:col-span-1 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm h-fit">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Tu Token de API Personal</span>
          <div className="flex items-center gap-2 bg-gray-55 p-3 rounded-xl border border-gray-100 select-all font-mono text-sm text-gray-800 break-all mb-4">
            {userProfile.apiToken}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Token
                </>
              )}
            </button>

            <button
              onClick={handleRotateToken}
              disabled={rotating}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
              Regenerar Token
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
            Mantén tu Token en secreto. Cualquiera que posea este token puede consumir la API pública en tu nombre.
          </div>
        </div>

        {/* Documentation Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Endpoint Specification */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-indigo-600" />
              Endpoint de la API
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400">Método de Solicitud</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-md">GET</span>
                  <span className="text-sm font-mono text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md overflow-x-auto w-full max-w-full">
                    /api/published-articles
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-gray-400 block mb-1">Enlace del Endpoint Real</span>
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                >
                  {apiUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Code Snippets */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Consumo vía cURL (Encabezado)
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap p-3 bg-slate-950 rounded-xl text-indigo-300">
              {curlExample}
            </pre>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800 my-4 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Estructura de Respuesta Esperada (JSON)
              </span>
            </div>
            <pre className="overflow-x-auto p-3 bg-slate-950 rounded-xl text-emerald-400 max-h-60 overflow-y-auto">
              {responsePlaceholder}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

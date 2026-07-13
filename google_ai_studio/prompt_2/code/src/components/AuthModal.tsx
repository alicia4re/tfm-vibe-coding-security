/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, X, ArrowRight, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { collection, doc, setDoc, getDocs, limit, query } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const generateApiToken = () => {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('¡Sesión iniciada con éxito!');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        // Check if there are any users in the db to determine if they are the first user
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const usersSnap = await getDocs(q);
        const isFirstUser = usersSnap.empty;

        const role = isFirstUser ? 'editor' : 'lector';

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;
        const apiToken = generateApiToken();

        const profile: UserProfile = {
          uid,
          email,
          role,
          apiToken,
          createdAt: new Date(),
        };

        await setDoc(doc(db, 'users', uid), profile);

        setSuccessMsg(`¡Registro completado! Tu rol es: ${role.toUpperCase()}.${
          isFirstUser ? ' (Asignado automáticamente por ser el primer usuario)' : ''
        }`);

        onAuthSuccess(profile);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === 'recover') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Se ha enviado un correo electrónico para restablecer la contraseña.');
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = err.message || 'Ha ocurrido un error inesperado.';
      if (err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Credenciales incorrectas. Comprueba tu correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Este correo electrónico ya está registrado.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'El formato del correo electrónico no es válido.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'No existe ningún usuario registrado con este correo.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'La contraseña es demasiado débil.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear una cuenta'}
            {mode === 'recover' && 'Restablecer contraseña'}
          </h2>
          <p className="text-sm text-gray-500 mt-1.5">
            {mode === 'login' && 'Bienvenido de nuevo a nuestra mesa redonda'}
            {mode === 'register' && 'Únete a nuestra comunidad de lectores y autores'}
            {mode === 'recover' && 'Te enviaremos las instrucciones de recuperación'}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-red-55 text-red-700 rounded-xl border border-red-100 text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 mb-4 bg-emerald-55 text-emerald-700 rounded-xl border border-emerald-100 text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>

          {mode !== 'recover' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'register' && 'Crear cuenta'}
                {mode === 'recover' && 'Enviar enlace de recuperación'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Auth Mode Toggle Footer */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-500">
          {mode === 'login' && (
            <>
              ¿No tienes una cuenta?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Regístrate
              </button>
            </>
          )}

          {mode === 'register' && (
            <>
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Inicia sesión
              </button>
            </>
          )}

          {mode === 'recover' && (
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Volver al inicio de sesión
            </button>
          )}
        </div>

        {/* Automatic editor note for the first user */}
        {mode === 'register' && (
          <div className="mt-4 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-700 flex gap-2 items-start">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Nota:</strong> El primer usuario que se registre en el blog será nombrado <strong>Editor</strong> de forma totalmente automática. Los siguientes usuarios serán <strong>Lectores</strong> por defecto.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('user', JSON.stringify(response.user));
      
      const isAdmin = response.user.userRoles?.some((userRole: any) => 
        userRole.role?.name === 'Administrador' || userRole.role?.name === 'Admin'
      );
      
      if (isAdmin) {
        router.push('/');
      } else {
        router.push('/pos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <Image 
              src="/logo2.png" 
              alt="Smart Services Logo" 
              width={180}
              height={60}
              className="object-contain"
            />
          </div>

          {/* Título */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Inicia sesión en tu cuenta.
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu correo electrónico y contraseña para acceder.
            </p>
          </div>

          {/* Formulario */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="superadmin@example.com"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Link de contraseña olvidada */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Lado Derecho - Información */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          {/* Card con gráfico */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-12 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl font-bold">S</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Panel Administrativo</h3>
                <p className="text-sm text-white/80">Smart Services</p>
              </div>
            </div>

            {/* Gráfico simulado */}
            <div className="flex items-end justify-between h-32 gap-3">
              <div className="flex-1 bg-white/30 rounded-lg" style={{ height: '45%' }}></div>
              <div className="flex-1 bg-white/40 rounded-lg" style={{ height: '65%' }}></div>
              <div className="flex-1 bg-white/30 rounded-lg" style={{ height: '50%' }}></div>
              <div className="flex-1 bg-white rounded-lg" style={{ height: '85%' }}></div>
              <div className="flex-1 bg-white/30 rounded-lg" style={{ height: '55%' }}></div>
              <div className="flex-1 bg-white/40 rounded-lg" style={{ height: '70%' }}></div>
              <div className="flex-1 bg-white/30 rounded-lg" style={{ height: '60%' }}></div>
            </div>
          </div>

          {/* Texto informativo */}
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              La forma más fácil de gestionar tu negocio.
            </h2>
            <p className="text-lg text-white/90">
              Accede al panel administrativo de Smart Services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

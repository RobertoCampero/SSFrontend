'use client'

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredPermissions,
  requireAll = false 
}: ProtectedRouteProps) {
  const { hasPermission, hasAnyPermission, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Admin siempre tiene acceso
      if (isAdmin()) return;

      // Verificar permiso único
      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push('/unauthorized');
        return;
      }

      // Verificar múltiples permisos
      if (requiredPermissions && requiredPermissions.length > 0) {
        if (requireAll) {
          // Requiere TODOS los permisos
          const hasAll = requiredPermissions.every(p => hasPermission(p));
          if (!hasAll) {
            router.push('/unauthorized');
            return;
          }
        } else {
          // Requiere AL MENOS UNO de los permisos
          if (!hasAnyPermission(requiredPermissions)) {
            router.push('/unauthorized');
            return;
          }
        }
      }
    }
  }, [loading, requiredPermission, requiredPermissions, requireAll, hasPermission, hasAnyPermission, isAdmin, router]);

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return <>{children}</>;
}

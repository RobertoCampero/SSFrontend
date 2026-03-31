import { useState, useEffect } from 'react';
import { authService } from '@/lib/services';

interface UserPermissions {
  permissions: string[];
  roles: string[];
}

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Datos del usuario desde localStorage:', parsedUser);
        
        // Si el usuario no tiene warehouseId, obtener el perfil completo del backend
        if (!parsedUser.warehouseId && authService.isAuthenticated()) {
          try {
            console.log('⚠️ Usuario sin warehouseId, obteniendo perfil completo del backend...');
            const fullProfile = await authService.getProfile();
            console.log('✅ Perfil completo obtenido:', fullProfile);
            
            // Actualizar localStorage con el perfil completo
            const updatedUser = { ...parsedUser, ...fullProfile };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            
            const userRoles = updatedUser.roles || [];
            const userPermissions = updatedUser.permissions || [];
            setRoles(userRoles);
            setPermissions(userPermissions);
          } catch (error) {
            console.error('Error al obtener perfil completo:', error);
            // Usar los datos del localStorage aunque no tenga warehouseId
            setUser(parsedUser);
            setRoles(parsedUser.roles || []);
            setPermissions(parsedUser.permissions || []);
          }
        } else {
          setUser(parsedUser);
          const userRoles = parsedUser.roles || [];
          const userPermissions = parsedUser.permissions || [];
          setRoles(userRoles);
          setPermissions(userPermissions);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(p => permissions.includes(p));
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const isAdmin = (): boolean => {
    return roles.includes('Administrador') || roles.includes('Admin');
  };

  return {
    user,
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    refreshAuth: loadUserData
  };
}

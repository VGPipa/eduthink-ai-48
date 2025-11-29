import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, AuthContextType, SignupData } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for demo
const MOCK_USERS: Record<string, User & { password: string }> = {
  'admin@eduthink.com': {
    id: '1',
    email: 'admin@eduthink.com',
    nombre: 'Carlos',
    apellido: 'Administrador',
    rol: 'admin',
    password: 'admin123'
  },
  'profesor@eduthink.com': {
    id: '2',
    email: 'profesor@eduthink.com',
    nombre: 'María',
    apellido: 'García',
    rol: 'profesor',
    password: 'profesor123'
  },
  'alumno@eduthink.com': {
    id: '3',
    email: 'alumno@eduthink.com',
    nombre: 'Juan',
    apellido: 'Pérez',
    rol: 'alumno',
    password: 'alumno123'
  },
  'apoderado@eduthink.com': {
    id: '4',
    email: 'apoderado@eduthink.com',
    nombre: 'Ana',
    apellido: 'Martínez',
    rol: 'apoderado',
    password: 'apoderado123'
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('eduthink_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = MOCK_USERS[email];
    if (mockUser && mockUser.password === password) {
      const { password: _, ...userData } = mockUser;
      setUser(userData);
      localStorage.setItem('eduthink_user', JSON.stringify(userData));
    } else {
      throw new Error('Credenciales inválidas');
    }
    setIsLoading(false);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (MOCK_USERS[data.email]) {
      setIsLoading(false);
      throw new Error('El correo ya está registrado');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol
    };
    
    setUser(newUser);
    localStorage.setItem('eduthink_user', JSON.stringify(newUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('eduthink_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

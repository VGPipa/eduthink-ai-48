export type UserRole = 'admin' | 'profesor' | 'alumno' | 'apoderado';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

export interface SignupData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: UserRole;
}

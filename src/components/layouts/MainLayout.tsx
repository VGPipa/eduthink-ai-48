import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  CalendarDays,
  Sparkles,
  LogOut,
  Menu,
  X,
  School,
  ClipboardList,
  Loader2
} from 'lucide-react';

const NAVIGATION: Record<AppRole, Array<{ to: string; icon: typeof LayoutDashboard; label: string }>> = {
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/plan-anual', icon: CalendarDays, label: 'Plan Anual' },
    { to: '/admin/asignaciones', icon: ClipboardList, label: 'Asignaciones' },
    { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { to: '/admin/configuracion', icon: Settings, label: 'Configuración' }
  ],
  profesor: [
    { to: '/profesor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profesor/planificacion', icon: CalendarDays, label: 'Planificación' },
    { to: '/profesor/generar-clase', icon: Sparkles, label: 'Generar Clase' },
    { to: '/profesor/mis-salones', icon: School, label: 'Métricas' }
  ],
  alumno: [
    { to: '/alumno/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/alumno/evaluaciones', icon: ClipboardList, label: 'Evaluaciones' },
    { to: '/alumno/progreso', icon: BarChart3, label: 'Mi Progreso' }
  ],
  apoderado: [
    { to: '/apoderado/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/apoderado/hijos', icon: Users, label: 'Mis Hijos' },
    { to: '/apoderado/reportes', icon: BarChart3, label: 'Reportes' }
  ]
};

export function MainLayout() {
  const { user, logout } = useAuth();
  const { primaryRole, roleLabel, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use role-based navigation, fallback to admin if no role
  const navigation = primaryRole ? NAVIGATION[primaryRole] : NAVIGATION['admin'];

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <Logo size="sm" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Logo size="sm" />
          <div className="w-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

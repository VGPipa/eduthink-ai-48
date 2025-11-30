import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

// Pages
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Layouts
import { MainLayout } from "./components/layouts/MainLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PlanAnual from "./pages/admin/PlanAnual";
import PlanAnualDetalle from "./pages/admin/PlanAnualDetalle";
import Asignaciones from "./pages/admin/Asignaciones";
import Configuracion from "./pages/admin/Configuracion";
import Usuarios from "./pages/admin/Usuarios";

// Profesor pages
import ProfesorDashboard from "./pages/profesor/ProfesorDashboard";
import Planificacion from "./pages/profesor/Planificacion";
import TemaDetalle from "./pages/profesor/TemaDetalle";
import GenerarClase from "./pages/profesor/GenerarClase";
import PreClase from "./pages/profesor/PreClase";
import PostClase from "./pages/profesor/PostClase";
import MisSalones from "./pages/profesor/MisSalones";


// Alumno pages
import AlumnoDashboard from "./pages/alumno/AlumnoDashboard";
import Evaluaciones from "./pages/alumno/Evaluaciones";
import Progreso from "./pages/alumno/Progreso";
import ResolverQuiz from "./pages/alumno/ResolverQuiz";
import ResultadoQuiz from "./pages/alumno/ResultadoQuiz";

// Apoderado pages
import ApoderadoDashboard from "./pages/apoderado/ApoderadoDashboard";
import Hijos from "./pages/apoderado/Hijos";
import Reportes from "./pages/apoderado/Reportes";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function RoleRedirect() {
  const { primaryRole, isLoading } = useUserRole();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const dashboardRoutes = {
    admin: '/admin/dashboard',
    profesor: '/profesor/dashboard',
    alumno: '/alumno/dashboard',
    apoderado: '/apoderado/dashboard',
  };
  
  const redirectTo = primaryRole ? dashboardRoutes[primaryRole] : '/admin/dashboard';
  return <Navigate to={redirectTo} replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={user ? <RoleRedirect /> : <Auth />} />
      
      {/* Root redirect */}
      <Route path="/" element={user ? <RoleRedirect /> : <Navigate to="/auth" replace />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/plan-anual" element={<PlanAnual />} />
        <Route path="/admin/plan-anual/:id" element={<PlanAnualDetalle />} />
        <Route path="/admin/asignaciones" element={<Asignaciones />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/configuracion" element={<Configuracion />} />
        
        {/* Profesor routes */}
        <Route path="/profesor/dashboard" element={<ProfesorDashboard />} />
        <Route path="/profesor/planificacion" element={<Planificacion />} />
        <Route path="/profesor/planificacion/tema/:temaId" element={<TemaDetalle />} />
        <Route path="/profesor/generar-clase" element={<GenerarClase />} />
        <Route path="/profesor/pre-clase" element={<PreClase />} />
        <Route path="/profesor/post-clase" element={<PostClase />} />
        <Route path="/profesor/mis-salones" element={<MisSalones />} />
        
        
        {/* Alumno routes */}
        <Route path="/alumno/dashboard" element={<AlumnoDashboard />} />
        <Route path="/alumno/evaluaciones" element={<Evaluaciones />} />
        <Route path="/alumno/progreso" element={<Progreso />} />
        <Route path="/alumno/quiz/:quizId" element={<ResolverQuiz />} />
        <Route path="/alumno/quiz/:quizId/resultado" element={<ResultadoQuiz />} />
        
        {/* Apoderado routes */}
        <Route path="/apoderado/dashboard" element={<ApoderadoDashboard />} />
        <Route path="/apoderado/hijos" element={<Hijos />} />
        <Route path="/apoderado/reportes" element={<Reportes />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

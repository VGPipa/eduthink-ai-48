import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  UserCircle,
  Loader2,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';

const ROLES: { value: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'admin', label: 'Administrador', icon: Users, description: 'Gestiona la institución' },
  { value: 'profesor', label: 'Profesor', icon: GraduationCap, description: 'Crea clases con IA' },
  { value: 'alumno', label: 'Alumno', icon: BookOpen, description: 'Aprende y evalúa' },
  { value: 'apoderado', label: 'Apoderado', icon: UserCircle, description: 'Sigue el progreso' }
];

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'profesor' as UserRole
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      toast({ title: '¡Bienvenido!', description: 'Sesión iniciada correctamente' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Error al iniciar sesión',
        variant: 'destructive' 
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(signupData);
      toast({ title: '¡Cuenta creada!', description: 'Tu cuenta ha sido registrada exitosamente' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Error al registrarse',
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <Logo size="lg" className="mb-8" />
          
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
            Fomenta el pensamiento crítico
          </h1>
          <p className="text-lg xl:text-xl opacity-90 mb-12 max-w-md">
            Transforma tu enseñanza con inteligencia artificial y análisis de aprendizaje en tiempo real.
          </p>

          <div className="space-y-6">
            {[
              { icon: Lightbulb, title: 'Clases generadas con IA', desc: 'Planifica sesiones enfocadas en pensamiento crítico' },
              { icon: Target, title: 'Evaluaciones inteligentes', desc: 'Diagnósticos PRE y POST automáticos' },
              { icon: TrendingUp, title: 'Métricas en tiempo real', desc: 'Analiza el progreso de cada estudiante' }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="p-2 rounded-lg bg-primary-foreground/20 backdrop-blur-sm">
                  <feature.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm opacity-80">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="lg:hidden mb-8">
            <Logo size="lg" />
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
                </Button>
              </form>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">Usuarios de prueba:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {Object.entries({
                    'admin@eduthink.com': 'admin123',
                    'profesor@eduthink.com': 'profesor123',
                    'alumno@eduthink.com': 'alumno123',
                    'apoderado@eduthink.com': 'apoderado123'
                  }).map(([email, pass]) => (
                    <button
                      key={email}
                      type="button"
                      className="text-left p-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={() => setLoginData({ email, password: pass })}
                    >
                      <span className="block font-medium text-foreground">{email.split('@')[0]}</span>
                      <span className="text-muted-foreground">{pass}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nombre">Nombre</Label>
                    <Input
                      id="signup-nombre"
                      placeholder="María"
                      value={signupData.nombre}
                      onChange={(e) => setSignupData({ ...signupData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-apellido">Apellido</Label>
                    <Input
                      id="signup-apellido"
                      placeholder="García"
                      value={signupData.apellido}
                      onChange={(e) => setSignupData({ ...signupData, apellido: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tipo de usuario</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setSignupData({ ...signupData, rol: role.value })}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          signupData.rol === role.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <role.icon className={`w-5 h-5 mb-1 ${signupData.rol === role.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="font-medium text-sm">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

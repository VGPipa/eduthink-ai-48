import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Bell,
  Save,
  CheckCircle2
} from 'lucide-react';

const MOCK_ANIOS = [
  { id: '1', nombre: 'Año Escolar 2024', inicio: '2024-03-01', fin: '2024-12-15', activo: true },
  { id: '2', nombre: 'Año Escolar 2025', inicio: '2025-03-01', fin: '2025-12-15', activo: false }
];

const MOCK_PERIODOS = [
  { id: '1', numero: 1, nombre: 'Bimestre I', inicio: '2024-03-01', fin: '2024-05-15', activo: false },
  { id: '2', numero: 2, nombre: 'Bimestre II', inicio: '2024-05-16', fin: '2024-07-31', activo: true },
  { id: '3', numero: 3, nombre: 'Bimestre III', inicio: '2024-08-01', fin: '2024-10-15', activo: false },
  { id: '4', numero: 4, nombre: 'Bimestre IV', inicio: '2024-10-16', fin: '2024-12-15', activo: false }
];

const MOCK_ALERTAS = {
  rangoDiasClasesPendientes: 14,
  diasUrgente: 1,
  diasProxima: 3,
  diasProgramada: 7,
  diasLejana: 14
};

export default function Configuracion() {
  const { toast } = useToast();
  const [selectedAnio, setSelectedAnio] = useState(MOCK_ANIOS[0].id);
  const [alertas, setAlertas] = useState(MOCK_ALERTAS);

  const handleGuardarAlertas = () => {
    toast({ title: 'Configuración guardada', description: 'Los parámetros de alertas han sido actualizados' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra años escolares, periodos y alertas del sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="anios">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="anios" className="gap-2">
            <Calendar className="w-4 h-4" />
            Años Escolares
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anios" className="mt-6 space-y-6">
          {/* Años escolares */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Años Escolares</CardTitle>
                <CardDescription>Gestiona los años académicos</CardDescription>
              </div>
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Año
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_ANIOS.map((anio) => (
                <div 
                  key={anio.id}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAnio === anio.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAnio(anio.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${anio.activo ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="font-medium">{anio.nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(anio.inicio).toLocaleDateString('es-ES')} - {new Date(anio.fin).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {anio.activo && <Badge className="bg-success text-success-foreground">Activo</Badge>}
                    <Button variant="ghost" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Periodos del año seleccionado */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Periodos Académicos</CardTitle>
                <CardDescription>Bimestres o trimestres del año seleccionado</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Periodo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {MOCK_PERIODOS.map((periodo) => (
                  <div 
                    key={periodo.id}
                    className={`p-4 rounded-lg border ${periodo.activo ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{periodo.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(periodo.inicio).toLocaleDateString('es-ES')} - {new Date(periodo.fin).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      {periodo.activo && (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Actual
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Alertas</CardTitle>
              <CardDescription>
                Define los rangos de días para la clasificación de clases en el dashboard del profesor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Rango de días para clases pendientes</Label>
                  <Input
                    type="number"
                    value={alertas.rangoDiasClasesPendientes}
                    onChange={(e) => setAlertas({...alertas, rangoDiasClasesPendientes: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Clases dentro de este rango aparecerán en "clases pendientes"
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Clasificación por proximidad</Label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-destructive">Urgente (días)</Label>
                    <Input
                      type="number"
                      value={alertas.diasUrgente}
                      onChange={(e) => setAlertas({...alertas, diasUrgente: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-warning">Próxima (días)</Label>
                    <Input
                      type="number"
                      value={alertas.diasProxima}
                      onChange={(e) => setAlertas({...alertas, diasProxima: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-primary">Programada (días)</Label>
                    <Input
                      type="number"
                      value={alertas.diasProgramada}
                      onChange={(e) => setAlertas({...alertas, diasProgramada: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Lejana (días)</Label>
                    <Input
                      type="number"
                      value={alertas.diasLejana}
                      onChange={(e) => setAlertas({...alertas, diasLejana: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <Button variant="gradient" onClick={handleGuardarAlertas}>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

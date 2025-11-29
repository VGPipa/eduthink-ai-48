import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  User
} from 'lucide-react';
import { useState } from 'react';

const MOCK_REPORTES = [
  {
    id: '1',
    titulo: 'Reporte Bimestral - Juan',
    tipo: 'bimestral',
    hijo: 'Juan Pérez',
    periodo: 'Bimestre II 2024',
    fecha: '2024-01-20',
    resumen: 'Buen progreso en Matemáticas y Ciencias. Necesita refuerzo en Historia.'
  },
  {
    id: '2',
    titulo: 'Reporte Semanal - María',
    tipo: 'semanal',
    hijo: 'María Pérez',
    periodo: 'Semana 3 - Enero 2024',
    fecha: '2024-01-19',
    resumen: 'Excelente desempeño en todas las materias. Destacada en Ciencias.'
  },
  {
    id: '3',
    titulo: 'Retroalimentación - Juan',
    tipo: 'retroalimentacion',
    hijo: 'Juan Pérez',
    periodo: 'Matemáticas - Ecuaciones',
    fecha: '2024-01-18',
    resumen: 'Se recomienda practicar más ejercicios de ecuaciones con fracciones.'
  },
  {
    id: '4',
    titulo: 'Reporte Mensual - Juan',
    tipo: 'mensual',
    hijo: 'Juan Pérez',
    periodo: 'Enero 2024',
    fecha: '2024-01-15',
    resumen: 'Progreso constante durante el mes. Mejoró en participación.'
  }
];

export default function Reportes() {
  const [filtroHijo, setFiltroHijo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'bimestral':
        return <Badge variant="default">Bimestral</Badge>;
      case 'semanal':
        return <Badge variant="secondary">Semanal</Badge>;
      case 'mensual':
        return <Badge variant="outline">Mensual</Badge>;
      case 'retroalimentacion':
        return <Badge className="bg-info text-info-foreground">Retroalimentación</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const reportesFiltrados = MOCK_REPORTES.filter(r => {
    if (filtroHijo !== 'todos' && !r.hijo.toLowerCase().includes(filtroHijo.toLowerCase())) return false;
    if (filtroTipo !== 'todos' && r.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Accede a los reportes de progreso de tus hijos
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={filtroHijo} onValueChange={setFiltroHijo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Hijo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="juan">Juan</SelectItem>
              <SelectItem value="maria">María</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="bimestral">Bimestral</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="retroalimentacion">Retroalimentación</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports list */}
      <div className="space-y-4">
        {reportesFiltrados.map((reporte) => (
          <Card key={reporte.id} className="hover:shadow-elevated transition-shadow">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{reporte.titulo}</h3>
                      {getTipoBadge(reporte.tipo)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {reporte.hijo}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {reporte.periodo}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{reporte.resumen}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {new Date(reporte.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reportesFiltrados.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No hay reportes</h3>
            <p className="text-muted-foreground">No se encontraron reportes con los filtros seleccionados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

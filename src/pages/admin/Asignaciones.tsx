import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  BookOpen,
  GraduationCap,
  AlertCircle
} from 'lucide-react';

const MOCK_STATS = {
  totalAsignaciones: 48,
  profesoresSinAsignar: 3,
  materiasCubiertas: 12,
  gruposCubiertos: 18
};

const MOCK_ASIGNACIONES = [
  { id: '1', profesor: 'María García', materia: 'Matemáticas', grupo: '3ro A', anio: '2024' },
  { id: '2', profesor: 'María García', materia: 'Matemáticas', grupo: '3ro B', anio: '2024' },
  { id: '3', profesor: 'Juan López', materia: 'Lenguaje', grupo: '3ro A', anio: '2024' },
  { id: '4', profesor: 'Juan López', materia: 'Lenguaje', grupo: '4to A', anio: '2024' },
  { id: '5', profesor: 'Ana Martínez', materia: 'Ciencias', grupo: '4to A', anio: '2024' },
  { id: '6', profesor: 'Ana Martínez', materia: 'Ciencias', grupo: '4to B', anio: '2024' },
  { id: '7', profesor: 'Carlos Ruiz', materia: 'Historia', grupo: '5to A', anio: '2024' },
  { id: '8', profesor: 'Laura Sánchez', materia: 'Inglés', grupo: '3ro A', anio: '2024' }
];

export default function Asignaciones() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAsignaciones = MOCK_ASIGNACIONES.filter(a => 
    a.profesor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.materia.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.grupo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Asignaciones</h1>
          <p className="text-muted-foreground">
            Asigna profesores a materias y grupos
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total asignaciones"
          value={MOCK_STATS.totalAsignaciones}
          icon={Users}
        />
        <StatCard
          title="Profesores sin asignar"
          value={MOCK_STATS.profesoresSinAsignar}
          icon={AlertCircle}
          description="Requieren atención"
        />
        <StatCard
          title="Materias cubiertas"
          value={MOCK_STATS.materiasCubiertas}
          icon={BookOpen}
        />
        <StatCard
          title="Grupos cubiertos"
          value={MOCK_STATS.gruposCubiertos}
          icon={GraduationCap}
          variant="gradient"
        />
      </div>

      {/* Search and table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Asignaciones Actuales</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesor</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaciones.map((asignacion) => (
                <TableRow key={asignacion.id}>
                  <TableCell className="font-medium">{asignacion.profesor}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{asignacion.materia}</Badge>
                  </TableCell>
                  <TableCell>{asignacion.grupo}</TableCell>
                  <TableCell>{asignacion.anio}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

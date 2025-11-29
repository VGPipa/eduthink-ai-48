import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  BookOpen,
  GraduationCap,
  ChevronRight
} from 'lucide-react';

const MOCK_PLANES = [
  { id: '1', grado: '1ro Primaria', anio: '2024', estado: 'activo', materias: 8, temas: 32, cobertura: 25 },
  { id: '2', grado: '2do Primaria', anio: '2024', estado: 'activo', materias: 8, temas: 36, cobertura: 42 },
  { id: '3', grado: '3ro Primaria', anio: '2024', estado: 'activo', materias: 8, temas: 40, cobertura: 38 },
  { id: '4', grado: '4to Primaria', anio: '2024', estado: 'borrador', materias: 6, temas: 28, cobertura: 0 },
  { id: '5', grado: '5to Primaria', anio: '2024', estado: 'borrador', materias: 4, temas: 12, cobertura: 0 },
  { id: '6', grado: '6to Primaria', anio: '2024', estado: 'pendiente', materias: 0, temas: 0, cobertura: 0 }
];

const ANIOS_ESCOLARES = ['2024', '2025', '2026'];

export default function PlanAnual() {
  const [selectedAnio, setSelectedAnio] = useState('2024');

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-success text-success-foreground">Activo</Badge>;
      case 'borrador':
        return <Badge variant="secondary">Borrador</Badge>;
      case 'pendiente':
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Plan Anual</h1>
          <p className="text-muted-foreground">
            Configura los planes académicos por grado y año escolar
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedAnio} onValueChange={setSelectedAnio}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Año escolar" />
            </SelectTrigger>
            <SelectContent>
              {ANIOS_ESCOLARES.map((anio) => (
                <SelectItem key={anio} value={anio}>Año {anio}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_PLANES.map((plan) => (
          <Card key={plan.id} className="hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-bg">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.grado}</CardTitle>
                    <p className="text-sm text-muted-foreground">Año {plan.anio}</p>
                  </div>
                </div>
                {getEstadoBadge(plan.estado)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Materias</p>
                  <p className="text-xl font-bold">{plan.materias}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">Temas</p>
                  <p className="text-xl font-bold">{plan.temas}</p>
                </div>
              </div>

              {plan.estado !== 'pendiente' && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Cobertura</span>
                    <span className="font-medium">{plan.cobertura}%</span>
                  </div>
                  <Progress value={plan.cobertura} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                {plan.estado === 'pendiente' ? (
                  <Button variant="gradient" className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Plan
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

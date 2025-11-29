import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  BookOpen,
  Play,
  Eye
} from 'lucide-react';

const MOCK_PENDIENTES = [
  { id: '1', titulo: 'Quiz PRE - Ecuaciones', curso: 'Matemáticas', tipo: 'pre', tiempoLimite: 10, preguntas: 3 },
  { id: '2', titulo: 'Quiz POST - Revolución Industrial', curso: 'Historia', tipo: 'post', tiempoLimite: 15, preguntas: 5 },
  { id: '3', titulo: 'Quiz PRE - Ecosistemas', curso: 'Ciencias', tipo: 'pre', tiempoLimite: 10, preguntas: 3 }
];

const MOCK_COMPLETADOS = [
  { id: '4', titulo: 'Quiz POST - Fracciones', curso: 'Matemáticas', tipo: 'post', puntaje: 85, fecha: '2024-01-18' },
  { id: '5', titulo: 'Quiz PRE - Verbos irregulares', curso: 'Lenguaje', tipo: 'pre', puntaje: 90, fecha: '2024-01-17' },
  { id: '6', titulo: 'Quiz POST - El ciclo del agua', curso: 'Ciencias', tipo: 'post', puntaje: 78, fecha: '2024-01-15' },
  { id: '7', titulo: 'Quiz PRE - Números decimales', curso: 'Matemáticas', tipo: 'pre', puntaje: 92, fecha: '2024-01-12' }
];

export default function Evaluaciones() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mis Evaluaciones</h1>
        <p className="text-muted-foreground">
          Completa tus quizzes y revisa tus resultados
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pendientes">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="pendientes" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Pendientes ({MOCK_PENDIENTES.length})
          </TabsTrigger>
          <TabsTrigger value="completados" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Completados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-6 space-y-4">
          {MOCK_PENDIENTES.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-elevated transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${quiz.tipo === 'pre' ? 'bg-info/10' : 'bg-success/10'}`}>
                      <BookOpen className={`w-6 h-6 ${quiz.tipo === 'pre' ? 'text-info' : 'text-success'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{quiz.titulo}</h3>
                      <p className="text-muted-foreground">{quiz.curso}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quiz.tiempoLimite} minutos
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardList className="w-4 h-4" />
                          {quiz.preguntas} preguntas
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="gradient" size="lg" className="shrink-0">
                    <Play className="w-4 h-4 mr-2" />
                    Comenzar Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {MOCK_PENDIENTES.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">¡Todo al día!</h3>
                <p className="text-muted-foreground">No tienes evaluaciones pendientes por completar.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completados" className="mt-6 space-y-4">
          {MOCK_COMPLETADOS.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${quiz.puntaje >= 80 ? 'bg-success/10' : quiz.puntaje >= 60 ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                      <CheckCircle2 className={`w-6 h-6 ${quiz.puntaje >= 80 ? 'text-success' : quiz.puntaje >= 60 ? 'text-warning' : 'text-destructive'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{quiz.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{quiz.curso}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completado el {new Date(quiz.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${quiz.puntaje >= 80 ? 'text-success' : quiz.puntaje >= 60 ? 'text-warning' : 'text-destructive'}`}>
                        {quiz.puntaje}%
                      </p>
                      <Badge variant={quiz.tipo === 'pre' ? 'secondary' : 'default'}>
                        {quiz.tipo === 'pre' ? 'Diagnóstico' : 'Evaluación'}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

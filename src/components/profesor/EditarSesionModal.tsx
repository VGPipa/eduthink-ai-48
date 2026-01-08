import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import type { SesionClaseData } from '@/lib/ai/generate';

interface EditarSesionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sesion: SesionClaseData | null;
  onSave: (sesion: SesionClaseData) => void;
}

export function EditarSesionModal({ open, onOpenChange, sesion, onSave }: EditarSesionModalProps) {
  const [editedSesion, setEditedSesion] = useState<SesionClaseData | null>(null);

  useEffect(() => {
    if (sesion) {
      setEditedSesion(JSON.parse(JSON.stringify(sesion)));
    }
  }, [sesion]);

  if (!editedSesion) return null;

  const handleSave = () => {
    if (editedSesion) {
      onSave(editedSesion);
      onOpenChange(false);
    }
  };

  const updateDatosGenerales = (field: keyof SesionClaseData['datos_generales'], value: string) => {
    setEditedSesion(prev => prev ? {
      ...prev,
      datos_generales: { ...prev.datos_generales, [field]: value }
    } : null);
  };

  const updateProposito = (index: number, field: keyof SesionClaseData['propositos_aprendizaje']['filas'][0], value: string) => {
    setEditedSesion(prev => {
      if (!prev) return null;
      const newFilas = [...prev.propositos_aprendizaje.filas];
      newFilas[index] = { ...newFilas[index], [field]: value };
      return {
        ...prev,
        propositos_aprendizaje: { ...prev.propositos_aprendizaje, filas: newFilas }
      };
    });
  };

  const updatePreparacion = (field: 'que_hacer_antes' | 'recursos_materiales', value: string | string[]) => {
    setEditedSesion(prev => prev ? {
      ...prev,
      preparacion: { ...prev.preparacion, [field]: value }
    } : null);
  };

  const updateMomento = (momento: 'inicio' | 'desarrollo' | 'cierre', field: 'tiempo_minutos' | 'contenido', value: string | number) => {
    setEditedSesion(prev => prev ? {
      ...prev,
      momentos_sesion: {
        ...prev.momentos_sesion,
        [momento]: { ...prev.momentos_sesion[momento], [field]: value }
      }
    } : null);
  };

  const addRecurso = () => {
    setEditedSesion(prev => prev ? {
      ...prev,
      preparacion: {
        ...prev.preparacion,
        recursos_materiales: [...prev.preparacion.recursos_materiales, '']
      }
    } : null);
  };

  const removeRecurso = (index: number) => {
    setEditedSesion(prev => {
      if (!prev) return null;
      const newRecursos = prev.preparacion.recursos_materiales.filter((_, i) => i !== index);
      return {
        ...prev,
        preparacion: { ...prev.preparacion, recursos_materiales: newRecursos }
      };
    });
  };

  const updateRecurso = (index: number, value: string) => {
    setEditedSesion(prev => {
      if (!prev) return null;
      const newRecursos = [...prev.preparacion.recursos_materiales];
      newRecursos[index] = value;
      return {
        ...prev,
        preparacion: { ...prev.preparacion, recursos_materiales: newRecursos }
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Sesión de Clase</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="datos" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="datos">Datos Generales</TabsTrigger>
            <TabsTrigger value="propositos">Propósitos</TabsTrigger>
            <TabsTrigger value="preparacion">Preparación</TabsTrigger>
            <TabsTrigger value="momentos">Momentos</TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título de la sesión</Label>
                <Input
                  value={editedSesion.datos_generales.titulo_sesion}
                  onChange={(e) => updateDatosGenerales('titulo_sesion', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Docente</Label>
                <Input
                  value={editedSesion.datos_generales.docente}
                  onChange={(e) => updateDatosGenerales('docente', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  value={editedSesion.datos_generales.fecha}
                  onChange={(e) => updateDatosGenerales('fecha', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Input
                  value={editedSesion.datos_generales.nivel}
                  onChange={(e) => updateDatosGenerales('nivel', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Grado</Label>
                <Input
                  value={editedSesion.datos_generales.grado}
                  onChange={(e) => updateDatosGenerales('grado', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Área académica</Label>
                <Input
                  value={editedSesion.datos_generales.area_academica}
                  onChange={(e) => updateDatosGenerales('area_academica', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="propositos" className="space-y-4 mt-4">
            {editedSesion.propositos_aprendizaje.filas.map((fila, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label>Competencia</Label>
                  <Textarea
                    value={fila.competencia}
                    onChange={(e) => updateProposito(index, 'competencia', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Criterios de evaluación</Label>
                  <Textarea
                    value={fila.criterios_evaluacion}
                    onChange={(e) => updateProposito(index, 'criterios_evaluacion', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evidencia de aprendizaje</Label>
                  <Textarea
                    value={fila.evidencia_aprendizaje}
                    onChange={(e) => updateProposito(index, 'evidencia_aprendizaje', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instrumentos de valorización</Label>
                  <Input
                    value={fila.instrumento_valorizacion}
                    onChange={(e) => updateProposito(index, 'instrumento_valorizacion', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label>Enfoques transversales</Label>
              <Input
                value={editedSesion.propositos_aprendizaje.enfoques_transversales.join(', ')}
                onChange={(e) => setEditedSesion(prev => prev ? {
                  ...prev,
                  propositos_aprendizaje: {
                    ...prev.propositos_aprendizaje,
                    enfoques_transversales: e.target.value.split(',').map(s => s.trim())
                  }
                } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción de enfoques</Label>
              <Textarea
                value={editedSesion.propositos_aprendizaje.descripcion_enfoques}
                onChange={(e) => setEditedSesion(prev => prev ? {
                  ...prev,
                  propositos_aprendizaje: {
                    ...prev.propositos_aprendizaje,
                    descripcion_enfoques: e.target.value
                  }
                } : null)}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="preparacion" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>¿Qué necesitamos hacer antes de la sesión?</Label>
              <Textarea
                value={editedSesion.preparacion.que_hacer_antes}
                onChange={(e) => updatePreparacion('que_hacer_antes', e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Recursos y materiales</Label>
              <div className="space-y-2">
                {editedSesion.preparacion.recursos_materiales.map((recurso, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={recurso}
                      onChange={(e) => updateRecurso(index, e.target.value)}
                      placeholder="Recurso o material"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecurso(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addRecurso}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar recurso
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="momentos" className="space-y-4 mt-4">
            {(['inicio', 'desarrollo', 'cierre'] as const).map((momento) => (
              <div key={momento} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold capitalize">{momento}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editedSesion.momentos_sesion[momento].tiempo_minutos}
                      onChange={(e) => updateMomento(momento, 'tiempo_minutos', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <Textarea
                  value={editedSesion.momentos_sesion[momento].contenido}
                  onChange={(e) => updateMomento(momento, 'contenido', e.target.value)}
                  rows={6}
                />
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCatalogoCurricular, useCapacidades, type AdaptacionNEE } from '@/hooks/useCatalogoCurricular';
import { Lock, Info, Monitor, Trees, FileText, Smartphone, Square } from 'lucide-react';

// Mapeo de iconos para materiales
const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  'monitor': <Monitor className="w-4 h-4" />,
  'trees': <Trees className="w-4 h-4" />,
  'file-text': <FileText className="w-4 h-4" />,
  'smartphone': <Smartphone className="w-4 h-4" />,
  'square': <Square className="w-4 h-4" />,
};

interface FormularioContextoClaseProps {
  formData: {
    fecha: string;
    duracion: number;
    recursos: string[];
    contexto: string;
    temaPersonalizado: string;
    id_competencias: string[];
    id_capacidades: string[];
    id_enfoques_transversales: string[];
    materiales_seleccionados: string[];
    adaptaciones_nee: string[];
    contexto_adaptaciones: string;
    otro_material: string;
  };
  setFormData: (data: any) => void;
  cursoData: any;
  setCursoData: (data: any) => void;
  temaData: any;
  setTemaData: (data: any) => void;
  grupoData: any;
  setGrupoData: (data: any) => void;
  isExtraordinaria: boolean;
  isClaseCompletada: boolean;
  cursos: any[];
  temasParaCurso: any[];
  grupos: any[];
}

export function FormularioContextoClase({
  formData,
  setFormData,
  cursoData,
  setCursoData,
  temaData,
  setTemaData,
  grupoData,
  setGrupoData,
  isExtraordinaria,
  isClaseCompletada,
  cursos,
  temasParaCurso,
  grupos
}: FormularioContextoClaseProps) {
  // Obtener catálogos según el área curricular del curso
  const areaCurricular = cursoData?.nombre || '';
  const { competencias, enfoques, materiales, adaptacionesNee } = useCatalogoCurricular(areaCurricular);
  
  // Obtener capacidades de todas las competencias seleccionadas
  const competenciasSeleccionadas = formData.id_competencias || [];
  
  // Para simplificar, usamos la primera competencia seleccionada para cargar capacidades
  // pero mostramos todas las capacidades disponibles de las competencias seleccionadas
  const { data: capacidadesData = [] } = useCapacidades(competenciasSeleccionadas[0] || null);
  
  // Función helper para toggle de arrays
  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value) 
      ? array.filter(v => v !== value)
      : [...array, value];
  };

  return (
    <div className="space-y-6">
      {/* ========== SECCIÓN DATOS ========== */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="px-2 font-semibold text-sm text-foreground">Datos</legend>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Curso */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Área académica {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
            </Label>
            {isExtraordinaria ? (
              <Select 
                value={cursoData?.id || ''} 
                onValueChange={(value) => {
                  const curso = cursos.find(c => c?.id === value);
                  setCursoData(curso);
                }}
                disabled={isClaseCompletada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.filter(Boolean).map(c => (
                    <SelectItem key={c!.id} value={c!.id}>{c!.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={cursoData?.nombre || ''} disabled className="bg-muted/50" />
            )}
          </div>

          {/* Tema */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Tema {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
              {isExtraordinaria && '*'}
            </Label>
            {isExtraordinaria ? (
              <Select 
                value={temaData?.id || ''} 
                onValueChange={(value) => {
                  const tema = temasParaCurso.find(t => t.id === value);
                  setTemaData(tema || null);
                  if (tema && !formData.temaPersonalizado) {
                    setFormData((prev: any) => ({...prev, temaPersonalizado: tema.nombre}));
                  }
                }}
                disabled={!cursoData || isClaseCompletada}
              >
                <SelectTrigger>
                  <SelectValue placeholder={cursoData ? "Selecciona un tema" : "Primero selecciona un área"} />
                </SelectTrigger>
                <SelectContent>
                  {temasParaCurso.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={temaData?.nombre || ''} disabled className="bg-muted/50" />
            )}
          </div>

          {/* Duración */}
          <div className="space-y-2">
            <Label>Duración de la sesión</Label>
            <Select 
              value={String(formData.duracion)} 
              onValueChange={(value) => setFormData((prev: any) => ({...prev, duracion: parseInt(value)}))}
              disabled={isClaseCompletada}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="55">55 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
                <SelectItem value="90">90 minutos</SelectItem>
                <SelectItem value="120">120 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nivel (inferido del grado) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Nivel <Lock className="w-3 h-3 text-muted-foreground" />
            </Label>
            <Input 
              value={grupoData?.grado?.includes('Primaria') ? 'Primaria' : 'Secundaria'} 
              disabled 
              className="bg-muted/50"
            />
          </div>

          {/* Grado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              Grado {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
            </Label>
            {isExtraordinaria ? (
              <Select 
                value={grupoData?.id || ''} 
                onValueChange={(value) => {
                  const grupo = grupos.find(g => g?.id === value);
                  setGrupoData(grupo);
                }}
                disabled={isClaseCompletada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.filter(Boolean).map(g => (
                    <SelectItem key={g!.id} value={g!.id}>
                      {g!.nombre || `${g!.grado}° ${g!.seccion || ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                value={grupoData?.nombre || `${grupoData?.grado} ${grupoData?.seccion || ''}`.trim()} 
                disabled 
                className="bg-muted/50"
              />
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha programada</Label>
            <DatePicker
              value={formData.fecha}
              onChange={(value) => setFormData((prev: any) => ({...prev, fecha: value}))}
              placeholder="Selecciona una fecha"
              disabled={isClaseCompletada}
            />
          </div>
        </div>
      </fieldset>

      {/* ========== SECCIÓN PROPÓSITOS DE APRENDIZAJE ========== */}
      <fieldset className="border rounded-lg p-4 space-y-4">
        <legend className="px-2 font-semibold text-sm text-foreground">Propósitos de aprendizaje</legend>
        
        {/* Competencias - selección múltiple */}
        <div className="space-y-2">
          <Label>Competencias</Label>
          {competencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay competencias para esta área</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {competencias.map(c => (
                <div key={c.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`competencia-${c.id}`}
                    checked={(formData.id_competencias || []).includes(c.id)}
                    onCheckedChange={() => {
                      if (isClaseCompletada) return;
                      const newCompetencias = toggleArrayValue(formData.id_competencias || [], c.id);
                      setFormData((prev: any) => ({...prev, id_competencias: newCompetencias}));
                    }}
                    disabled={isClaseCompletada}
                  />
                  <Label htmlFor={`competencia-${c.id}`} className="cursor-pointer text-sm leading-tight">
                    {c.nombre}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capacidades - selección múltiple */}
        <div className="space-y-2">
          <Label>Capacidades</Label>
          {(formData.id_competencias || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Primero selecciona al menos una competencia</p>
          ) : capacidadesData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay capacidades disponibles</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {capacidadesData.map((c: any) => (
                <div key={c.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`capacidad-${c.id}`}
                    checked={(formData.id_capacidades || []).includes(c.id)}
                    onCheckedChange={() => {
                      if (isClaseCompletada) return;
                      const newCapacidades = toggleArrayValue(formData.id_capacidades || [], c.id);
                      setFormData((prev: any) => ({...prev, id_capacidades: newCapacidades}));
                    }}
                    disabled={isClaseCompletada}
                  />
                  <Label htmlFor={`capacidad-${c.id}`} className="cursor-pointer text-sm leading-tight">
                    {c.nombre}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enfoques Transversales - selección múltiple */}
        <div className="space-y-2">
          <Label>Enfoques transversales</Label>
          <div className="grid md:grid-cols-2 gap-2">
            {enfoques.map(e => (
              <div key={e.id} className="flex items-start space-x-2">
                <Checkbox
                  id={`enfoque-${e.id}`}
                  checked={(formData.id_enfoques_transversales || []).includes(e.id)}
                  onCheckedChange={() => {
                    if (isClaseCompletada) return;
                    const newEnfoques = toggleArrayValue(formData.id_enfoques_transversales || [], e.id);
                    setFormData((prev: any) => ({...prev, id_enfoques_transversales: newEnfoques}));
                  }}
                  disabled={isClaseCompletada}
                />
                <Label htmlFor={`enfoque-${e.id}`} className="cursor-pointer text-sm leading-tight">
                  {e.nombre}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* ========== SECCIÓN MATERIALES Y ADAPTACIONES (2 columnas) ========== */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Materiales disponibles */}
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 font-semibold text-sm text-foreground">Materiales disponibles</legend>
          <div className="space-y-2">
            {materiales.map(m => (
              <div key={m.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`material-${m.id}`}
                  checked={formData.materiales_seleccionados.includes(m.nombre)}
                  onCheckedChange={(checked) => {
                    if (isClaseCompletada) return;
                    const newMateriales = checked
                      ? [...formData.materiales_seleccionados, m.nombre]
                      : formData.materiales_seleccionados.filter(mat => mat !== m.nombre);
                    setFormData((prev: any) => ({...prev, materiales_seleccionados: newMateriales}));
                  }}
                  disabled={isClaseCompletada}
                />
                <Label htmlFor={`material-${m.id}`} className="flex items-center gap-2 cursor-pointer">
                  {m.icono && MATERIAL_ICONS[m.icono]}
                  {m.nombre}
                </Label>
              </div>
            ))}
            {/* Campo Otro */}
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="material-otro"
                checked={formData.otro_material.length > 0}
                disabled={isClaseCompletada}
              />
              <Input
                placeholder="Otro material..."
                value={formData.otro_material}
                onChange={(e) => setFormData((prev: any) => ({...prev, otro_material: e.target.value}))}
                className="flex-1 h-8"
                disabled={isClaseCompletada}
              />
            </div>
          </div>
        </fieldset>

        {/* Adaptaciones NEE - Grid 3 columnas como la imagen */}
        <fieldset className="border rounded-lg p-4 space-y-4">
          <legend className="px-2 font-semibold text-sm text-foreground flex items-center gap-2">
            Adaptaciones (NEE)
          </legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {adaptacionesNee.map(nee => (
              <div key={nee.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`nee-${nee.codigo}`}
                  checked={formData.adaptaciones_nee.includes(nee.codigo)}
                  onCheckedChange={(checked) => {
                    if (isClaseCompletada) return;
                    const newAdaptaciones = checked
                      ? [...formData.adaptaciones_nee, nee.codigo]
                      : formData.adaptaciones_nee.filter(a => a !== nee.codigo);
                    setFormData((prev: any) => ({...prev, adaptaciones_nee: newAdaptaciones}));
                  }}
                  disabled={isClaseCompletada}
                  className="rounded-full"
                />
                <Label htmlFor={`nee-${nee.codigo}`} className="cursor-pointer text-sm">
                  {nee.nombre}
                </Label>
              </div>
            ))}
          </div>
          
          {/* Textarea siempre visible */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Adaptaciones personalizadas (opcional)</Label>
            <Textarea
              placeholder="Describe adaptaciones específicas para estudiantes con NEE..."
              value={formData.contexto_adaptaciones}
              onChange={(e) => setFormData((prev: any) => ({...prev, contexto_adaptaciones: e.target.value}))}
              rows={3}
              disabled={isClaseCompletada}
            />
          </div>
        </fieldset>
      </div>

      {/* ========== SECCIÓN CONTEXTO LIBRE ========== */}
      <div className="space-y-2">
        <Label>Contexto específico del salón (opcional)</Label>
        <Textarea 
          placeholder="Describe el contexto del salón: conocimientos previos, dinámica del aula, situaciones particulares..."
          value={formData.contexto}
          onChange={(e) => setFormData((prev: any) => ({...prev, contexto: e.target.value}))}
          rows={3}
          disabled={isClaseCompletada}
        />
      </div>
    </div>
  );
}

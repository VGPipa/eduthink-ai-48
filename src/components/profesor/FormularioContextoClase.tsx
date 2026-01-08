import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { useCatalogoCurricular, useCapacidadesMultiples } from '@/hooks/useCatalogoCurricular';
import { Lock, Monitor, Trees, FileText, Smartphone, Square, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeo de iconos para materiales
const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  'monitor': <Monitor className="w-4 h-4" />,
  'trees': <Trees className="w-4 h-4" />,
  'file-text': <FileText className="w-4 h-4" />,
  'smartphone': <Smartphone className="w-4 h-4" />,
  'square': <Square className="w-4 h-4" />,
  'laptop': <Laptop className="w-4 h-4" />,
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

// Componente de checkbox circular personalizado
function CircularCheckbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
        checked ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
    </button>
  );
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
  
  // Obtener capacidades de TODAS las competencias seleccionadas
  const competenciasSeleccionadas = formData.id_competencias || [];
  const { data: capacidadesData = [] } = useCapacidadesMultiples(competenciasSeleccionadas);
  
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
                  // Limpiar competencias y capacidades al cambiar de área
                  setFormData((prev: any) => ({
                    ...prev, 
                    id_competencias: [], 
                    id_capacidades: []
                  }));
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
        
        {/* Competencias - Badges clickeables */}
        <div className="space-y-2">
          <Label>Competencias</Label>
          {competencias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {areaCurricular ? 'No hay competencias para esta área' : 'Selecciona un área académica'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {competencias.map(c => {
                const isSelected = (formData.id_competencias || []).includes(c.id);
                return (
                  <Badge
                    key={c.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all px-3 py-1.5 text-sm font-normal",
                      isSelected 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-background hover:bg-muted border-muted-foreground/30",
                      isClaseCompletada && "cursor-not-allowed opacity-60"
                    )}
                    onClick={() => {
                      if (isClaseCompletada) return;
                      const newCompetencias = toggleArrayValue(formData.id_competencias || [], c.id);
                      // También limpiar capacidades que ya no corresponden
                      const capacidadesToKeep = (formData.id_capacidades || []).filter(capId => {
                        const cap = capacidadesData.find(cap => cap.id === capId);
                        return cap && newCompetencias.includes(cap.id_competencia || '');
                      });
                      setFormData((prev: any) => ({
                        ...prev, 
                        id_competencias: newCompetencias,
                        id_capacidades: capacidadesToKeep
                      }));
                    }}
                  >
                    {c.nombre}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Capacidades - Badges clickeables */}
        <div className="space-y-2">
          <Label>Capacidades</Label>
          {(formData.id_competencias || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Primero selecciona al menos una competencia</p>
          ) : capacidadesData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay capacidades disponibles</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {capacidadesData.map((c: any) => {
                const isSelected = (formData.id_capacidades || []).includes(c.id);
                return (
                  <Badge
                    key={c.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all px-3 py-1.5 text-sm font-normal",
                      isSelected 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "bg-background hover:bg-muted border-muted-foreground/30",
                      isClaseCompletada && "cursor-not-allowed opacity-60"
                    )}
                    onClick={() => {
                      if (isClaseCompletada) return;
                      const newCapacidades = toggleArrayValue(formData.id_capacidades || [], c.id);
                      setFormData((prev: any) => ({...prev, id_capacidades: newCapacidades}));
                    }}
                  >
                    {c.nombre}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Enfoques Transversales - Badges clickeables */}
        <div className="space-y-2">
          <Label>Enfoques transversales</Label>
          <div className="flex flex-wrap gap-2">
            {enfoques.map(e => {
              const isSelected = (formData.id_enfoques_transversales || []).includes(e.id);
              return (
                <Badge
                  key={e.id}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all px-3 py-1.5 text-sm font-normal",
                    isSelected 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-background hover:bg-muted border-muted-foreground/30",
                    isClaseCompletada && "cursor-not-allowed opacity-60"
                  )}
                  onClick={() => {
                    if (isClaseCompletada) return;
                    const newEnfoques = toggleArrayValue(formData.id_enfoques_transversales || [], e.id);
                    setFormData((prev: any) => ({...prev, id_enfoques_transversales: newEnfoques}));
                  }}
                >
                  {e.nombre}
                </Badge>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* ========== SECCIÓN MATERIALES Y ADAPTACIONES (2 columnas) ========== */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Materiales disponibles - Grid 3 columnas con checkboxes circulares */}
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 font-semibold text-sm text-foreground">Materiales disponibles</legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {materiales.map(m => {
              const isSelected = formData.materiales_seleccionados.includes(m.nombre);
              return (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer">
                  <CircularCheckbox
                    checked={isSelected}
                    onChange={() => {
                      if (isClaseCompletada) return;
                      const newMateriales = isSelected
                        ? formData.materiales_seleccionados.filter(mat => mat !== m.nombre)
                        : [...formData.materiales_seleccionados, m.nombre];
                      setFormData((prev: any) => ({...prev, materiales_seleccionados: newMateriales}));
                    }}
                    disabled={isClaseCompletada}
                  />
                  <span className="text-sm">{m.nombre}</span>
                </label>
              );
            })}
          </div>
          {/* Campo Otro material */}
          <div className="mt-4 space-y-1">
            <Label className="text-sm text-muted-foreground">Otro material (opcional)</Label>
            <Input
              placeholder="Especifica otros materiales..."
              value={formData.otro_material}
              onChange={(e) => setFormData((prev: any) => ({...prev, otro_material: e.target.value}))}
              disabled={isClaseCompletada}
            />
          </div>
        </fieldset>

        {/* Adaptaciones NEE - Grid 3 columnas con checkboxes circulares */}
        <fieldset className="border rounded-lg p-4 space-y-4">
          <legend className="px-2 font-semibold text-sm text-foreground">Adaptaciones (NEE)</legend>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
            {adaptacionesNee.map(nee => {
              const isSelected = formData.adaptaciones_nee.includes(nee.codigo);
              return (
                <label key={nee.id} className="flex items-center gap-2 cursor-pointer">
                  <CircularCheckbox
                    checked={isSelected}
                    onChange={() => {
                      if (isClaseCompletada) return;
                      const newAdaptaciones = isSelected
                        ? formData.adaptaciones_nee.filter(a => a !== nee.codigo)
                        : [...formData.adaptaciones_nee, nee.codigo];
                      setFormData((prev: any) => ({...prev, adaptaciones_nee: newAdaptaciones}));
                    }}
                    disabled={isClaseCompletada}
                  />
                  <span className="text-sm">{nee.nombre}</span>
                </label>
              );
            })}
          </div>
          
          {/* Textarea siempre visible */}
          <div className="space-y-1">
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

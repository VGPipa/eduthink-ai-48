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
    id_competencia: string;
    id_capacidad: string;
    id_enfoque_transversal: string;
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
  
  // Obtener capacidades según competencia seleccionada
  const { data: capacidades = [] } = useCapacidades(formData.id_competencia || null);

  // Cuando cambia la competencia, limpiar capacidad
  useEffect(() => {
    if (formData.id_competencia) {
      setFormData((prev: any) => ({ ...prev, id_capacidad: '' }));
    }
  }, [formData.id_competencia]);

  // Función para obtener nombre de competencia seleccionada
  const competenciaSeleccionada = competencias.find(c => c.id === formData.id_competencia);
  const capacidadSeleccionada = capacidades.find((c: any) => c.id === formData.id_capacidad);

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
        <div className="grid md:grid-cols-2 gap-4">
          {/* Competencia */}
          <div className="space-y-2">
            <Label>Competencias</Label>
            <Select 
              value={formData.id_competencia} 
              onValueChange={(value) => setFormData((prev: any) => ({...prev, id_competencia: value}))}
              disabled={isClaseCompletada || competencias.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={competencias.length === 0 ? "No hay competencias para esta área" : "Selecciona una competencia"} />
              </SelectTrigger>
              <SelectContent>
                {competencias.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {competenciaSeleccionada && (
              <p className="text-xs text-muted-foreground">{competenciaSeleccionada.descripcion}</p>
            )}
          </div>

          {/* Capacidad */}
          <div className="space-y-2">
            <Label>Capacidades</Label>
            <Select 
              value={formData.id_capacidad} 
              onValueChange={(value) => setFormData((prev: any) => ({...prev, id_capacidad: value}))}
              disabled={isClaseCompletada || !formData.id_competencia || capacidades.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.id_competencia ? "Primero selecciona una competencia" : "Selecciona una capacidad"} />
              </SelectTrigger>
              <SelectContent>
                {capacidades.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {capacidadSeleccionada && (
              <p className="text-xs text-muted-foreground">{capacidadSeleccionada.descripcion}</p>
            )}
          </div>

          {/* Enfoque Transversal */}
          <div className="space-y-2 md:col-span-2">
            <Label>Enfoque transversal</Label>
            <Select 
              value={formData.id_enfoque_transversal} 
              onValueChange={(value) => setFormData((prev: any) => ({...prev, id_enfoque_transversal: value}))}
              disabled={isClaseCompletada}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un enfoque transversal" />
              </SelectTrigger>
              <SelectContent>
                {enfoques.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {/* Adaptaciones NEE */}
        <fieldset className="border rounded-lg p-4 space-y-3">
          <legend className="px-2 font-semibold text-sm text-foreground flex items-center gap-2">
            Adaptaciones
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Selecciona las Necesidades Educativas Especiales presentes en tu aula. La IA generará estrategias de diferenciación específicas.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </legend>
          <div className="space-y-2">
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
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor={`nee-${nee.codigo}`} className="cursor-pointer flex items-center gap-1">
                        {nee.nombre}
                        <Badge variant="outline" className="text-xs ml-1">{nee.codigo}</Badge>
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="font-medium mb-1">{nee.nombre}</p>
                      <p className="text-xs">{nee.recomendaciones_ia}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
          {formData.adaptaciones_nee.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t">
              <Label className="text-xs text-muted-foreground">Notas adicionales sobre adaptaciones</Label>
              <Textarea
                placeholder="Describe detalles específicos sobre las necesidades del grupo..."
                value={formData.contexto_adaptaciones}
                onChange={(e) => setFormData((prev: any) => ({...prev, contexto_adaptaciones: e.target.value}))}
                rows={2}
                disabled={isClaseCompletada}
              />
            </div>
          )}
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alumnos: {
        Row: {
          caracteristicas: Json | null
          created_at: string
          edad: number | null
          grado: string | null
          id: string
          seccion: string | null
          user_id: string | null
        }
        Insert: {
          caracteristicas?: Json | null
          created_at?: string
          edad?: number | null
          grado?: string | null
          id?: string
          seccion?: string | null
          user_id?: string | null
        }
        Update: {
          caracteristicas?: Json | null
          created_at?: string
          edad?: number | null
          grado?: string | null
          id?: string
          seccion?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      alumnos_grupo: {
        Row: {
          anio_escolar: string
          created_at: string
          id: string
          id_alumno: string
          id_grupo: string
        }
        Insert: {
          anio_escolar: string
          created_at?: string
          id?: string
          id_alumno: string
          id_grupo: string
        }
        Update: {
          anio_escolar?: string
          created_at?: string
          id?: string
          id_alumno?: string
          id_grupo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumnos_grupo_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumnos_grupo_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      anios_escolares: {
        Row: {
          activo: boolean | null
          anio_escolar: string
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          id_institucion: string
        }
        Insert: {
          activo?: boolean | null
          anio_escolar: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_institucion: string
        }
        Update: {
          activo?: boolean | null
          anio_escolar?: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_institucion?: string
        }
        Relationships: [
          {
            foreignKeyName: "anios_escolares_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      apoderados: {
        Row: {
          created_at: string
          id: string
          id_alumno: string | null
          relacion: Database["public"]["Enums"]["relacion_apoderado"] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_alumno?: string | null
          relacion?: Database["public"]["Enums"]["relacion_apoderado"] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_alumno?: string | null
          relacion?: Database["public"]["Enums"]["relacion_apoderado"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apoderados_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_profesor: {
        Row: {
          anio_escolar: string
          created_at: string
          id: string
          id_grupo: string
          id_materia: string
          id_profesor: string
        }
        Insert: {
          anio_escolar: string
          created_at?: string
          id?: string
          id_grupo: string
          id_materia: string
          id_profesor: string
        }
        Update: {
          anio_escolar?: string
          created_at?: string
          id?: string
          id_grupo?: string
          id_materia?: string
          id_profesor?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_profesor_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_profesor_id_materia_fkey"
            columns: ["id_materia"]
            isOneToOne: false
            referencedRelation: "cursos_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_profesor_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
        ]
      }
      clases: {
        Row: {
          contexto: string | null
          created_at: string
          duracion_minutos: number | null
          estado: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada: string | null
          fecha_programada: string | null
          id: string
          id_grupo: string
          id_guia_tema: string | null
          id_guia_version_actual: string | null
          id_profesor: string
          id_tema: string
          metodologia: string | null
          numero_sesion: number | null
          observaciones: string | null
          updated_at: string
        }
        Insert: {
          contexto?: string | null
          created_at?: string
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          id?: string
          id_grupo: string
          id_guia_tema?: string | null
          id_guia_version_actual?: string | null
          id_profesor: string
          id_tema: string
          metodologia?: string | null
          numero_sesion?: number | null
          observaciones?: string | null
          updated_at?: string
        }
        Update: {
          contexto?: string | null
          created_at?: string
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          id?: string
          id_grupo?: string
          id_guia_tema?: string | null
          id_guia_version_actual?: string | null
          id_profesor?: string
          id_tema?: string
          metodologia?: string | null
          numero_sesion?: number | null
          observaciones?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clases_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_guia_tema_fkey"
            columns: ["id_guia_tema"]
            isOneToOne: false
            referencedRelation: "guias_tema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_guia_version_actual_fkey"
            columns: ["id_guia_version_actual"]
            isOneToOne: false
            referencedRelation: "guias_clase_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_tema_fkey"
            columns: ["id_tema"]
            isOneToOne: false
            referencedRelation: "temas_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_alertas: {
        Row: {
          dias_lejana: number | null
          dias_programada: number | null
          dias_proxima: number | null
          dias_urgente: number | null
          id: string
          id_institucion: string
          rango_dias_clases_pendientes: number | null
        }
        Insert: {
          dias_lejana?: number | null
          dias_programada?: number | null
          dias_proxima?: number | null
          dias_urgente?: number | null
          id?: string
          id_institucion: string
          rango_dias_clases_pendientes?: number | null
        }
        Update: {
          dias_lejana?: number | null
          dias_programada?: number | null
          dias_proxima?: number | null
          dias_urgente?: number | null
          id?: string
          id_institucion?: string
          rango_dias_clases_pendientes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_alertas_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: true
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos_plan: {
        Row: {
          created_at: string
          descripcion: string | null
          horas_semanales: number | null
          id: string
          nombre: string
          objetivos: string | null
          orden: number
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          horas_semanales?: number | null
          id?: string
          nombre: string
          objetivos?: string | null
          orden?: number
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          horas_semanales?: number | null
          id?: string
          nombre?: string
          objetivos?: string | null
          orden?: number
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_plan_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_anuales"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          cantidad_alumnos: number | null
          created_at: string
          grado: string
          id: string
          id_institucion: string
          nombre: string
          seccion: string | null
        }
        Insert: {
          cantidad_alumnos?: number | null
          created_at?: string
          grado: string
          id?: string
          id_institucion: string
          nombre: string
          seccion?: string | null
        }
        Update: {
          cantidad_alumnos?: number | null
          created_at?: string
          grado?: string
          id?: string
          id_institucion?: string
          nombre?: string
          seccion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_clase_versiones: {
        Row: {
          aprobada_por: string | null
          contenido: Json | null
          created_at: string
          es_version_final: boolean | null
          estado: string | null
          estructura: Json | null
          fecha_aprobacion: string | null
          generada_ia: boolean | null
          id: string
          id_clase: string
          objetivos: string | null
          preguntas_socraticas: Json | null
          version_numero: number | null
        }
        Insert: {
          aprobada_por?: string | null
          contenido?: Json | null
          created_at?: string
          es_version_final?: boolean | null
          estado?: string | null
          estructura?: Json | null
          fecha_aprobacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          version_numero?: number | null
        }
        Update: {
          aprobada_por?: string | null
          contenido?: Json | null
          created_at?: string
          es_version_final?: boolean | null
          estado?: string | null
          estructura?: Json | null
          fecha_aprobacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase?: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          version_numero?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guias_clase_versiones_aprobada_por_fkey"
            columns: ["aprobada_por"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_clase_versiones_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_tema: {
        Row: {
          contenido: Json | null
          contexto_grupo: string | null
          created_at: string
          estructura_sesiones: Json | null
          id: string
          id_profesor: string
          id_tema: string
          metodologias: string[] | null
          objetivos_generales: string | null
          total_sesiones: number | null
          updated_at: string
        }
        Insert: {
          contenido?: Json | null
          contexto_grupo?: string | null
          created_at?: string
          estructura_sesiones?: Json | null
          id?: string
          id_profesor: string
          id_tema: string
          metodologias?: string[] | null
          objetivos_generales?: string | null
          total_sesiones?: number | null
          updated_at?: string
        }
        Update: {
          contenido?: Json | null
          contexto_grupo?: string | null
          created_at?: string
          estructura_sesiones?: Json | null
          id?: string
          id_profesor?: string
          id_tema?: string
          metodologias?: string[] | null
          objetivos_generales?: string | null
          total_sesiones?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guias_tema_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_tema_id_tema_fkey"
            columns: ["id_tema"]
            isOneToOne: false
            referencedRelation: "temas_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      instituciones: {
        Row: {
          configuracion: Json | null
          created_at: string
          id: string
          logo: string | null
          nombre: string
          updated_at: string
        }
        Insert: {
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo?: string | null
          nombre: string
          updated_at?: string
        }
        Update: {
          configuracion?: Json | null
          created_at?: string
          id?: string
          logo?: string | null
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      periodos_academicos: {
        Row: {
          activo: boolean | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          id_anio_escolar: string
          nombre: string
          numero: number
        }
        Insert: {
          activo?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_anio_escolar: string
          nombre: string
          numero: number
        }
        Update: {
          activo?: boolean | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          id_anio_escolar?: string
          nombre?: string
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "periodos_academicos_id_anio_escolar_fkey"
            columns: ["id_anio_escolar"]
            isOneToOne: false
            referencedRelation: "anios_escolares"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_anuales: {
        Row: {
          anio: string
          created_at: string
          created_by: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["plan_estado"]
          grado: string
          id: string
          id_institucion: string | null
          plan_base: boolean | null
          updated_at: string
        }
        Insert: {
          anio: string
          created_at?: string
          created_by: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["plan_estado"]
          grado: string
          id?: string
          id_institucion?: string | null
          plan_base?: boolean | null
          updated_at?: string
        }
        Update: {
          anio?: string
          created_at?: string
          created_by?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["plan_estado"]
          grado?: string
          id?: string
          id_institucion?: string | null
          plan_base?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_anuales_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      preguntas: {
        Row: {
          concepto: string | null
          created_at: string
          id: string
          id_quiz: string
          justificacion: string | null
          opciones: Json | null
          orden: number | null
          respuesta_correcta: string | null
          texto_pregunta: string
          tipo: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Insert: {
          concepto?: string | null
          created_at?: string
          id?: string
          id_quiz: string
          justificacion?: string | null
          opciones?: Json | null
          orden?: number | null
          respuesta_correcta?: string | null
          texto_pregunta: string
          tipo?: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Update: {
          concepto?: string | null
          created_at?: string
          id?: string
          id_quiz?: string
          justificacion?: string | null
          opciones?: Json | null
          orden?: number | null
          respuesta_correcta?: string | null
          texto_pregunta?: string
          tipo?: Database["public"]["Enums"]["tipo_pregunta"] | null
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      profesores: {
        Row: {
          activo: boolean | null
          created_at: string
          especialidad: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          especialidad?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          especialidad?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          id_institucion: string | null
          nombre: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_institucion?: string | null
          nombre?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_institucion?: string | null
          nombre?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible: string | null
          fecha_limite: string | null
          id: string
          id_clase: string
          instrucciones: string | null
          tiempo_limite: number | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
          titulo: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible?: string | null
          fecha_limite?: string | null
          id?: string
          id_clase: string
          instrucciones?: string | null
          tiempo_limite?: number | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
          titulo: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible?: string | null
          fecha_limite?: string | null
          id?: string
          id_clase?: string
          instrucciones?: string | null
          tiempo_limite?: number | null
          tipo?: Database["public"]["Enums"]["tipo_quiz"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      recomendaciones: {
        Row: {
          contenido: string | null
          created_at: string
          id: string
          id_quiz: string
        }
        Insert: {
          contenido?: string | null
          created_at?: string
          id?: string
          id_quiz: string
        }
        Update: {
          contenido?: string | null
          created_at?: string
          id?: string
          id_quiz?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendaciones_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_alumno: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio: string | null
          fecha_inicio: string | null
          id: string
          id_alumno: string
          id_quiz: string
          puntaje_total: number | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio?: string | null
          fecha_inicio?: string | null
          id?: string
          id_alumno: string
          id_quiz: string
          puntaje_total?: number | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio?: string | null
          fecha_inicio?: string | null
          id?: string
          id_alumno?: string
          id_quiz?: string
          puntaje_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_alumno_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_alumno_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_detalle: {
        Row: {
          es_correcta: boolean | null
          id: string
          id_pregunta: string
          id_respuesta_alumno: string
          respuesta_alumno: string | null
          tiempo_segundos: number | null
        }
        Insert: {
          es_correcta?: boolean | null
          id?: string
          id_pregunta: string
          id_respuesta_alumno: string
          respuesta_alumno?: string | null
          tiempo_segundos?: number | null
        }
        Update: {
          es_correcta?: boolean | null
          id?: string
          id_pregunta?: string
          id_respuesta_alumno?: string
          respuesta_alumno?: string | null
          tiempo_segundos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_detalle_id_pregunta_fkey"
            columns: ["id_pregunta"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_detalle_id_respuesta_alumno_fkey"
            columns: ["id_respuesta_alumno"]
            isOneToOne: false
            referencedRelation: "respuestas_alumno"
            referencedColumns: ["id"]
          },
        ]
      }
      retroalimentaciones: {
        Row: {
          areas_mejora: Json | null
          contenido: string | null
          created_at: string
          fortalezas: Json | null
          id: string
          id_alumno: string | null
          id_clase: string
          recomendaciones: Json | null
          tipo: string | null
        }
        Insert: {
          areas_mejora?: Json | null
          contenido?: string | null
          created_at?: string
          fortalezas?: Json | null
          id?: string
          id_alumno?: string | null
          id_clase: string
          recomendaciones?: Json | null
          tipo?: string | null
        }
        Update: {
          areas_mejora?: Json | null
          contenido?: string | null
          created_at?: string
          fortalezas?: Json | null
          id?: string
          id_alumno?: string | null
          id_clase?: string
          recomendaciones?: Json | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retroalimentaciones_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retroalimentaciones_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      temas_plan: {
        Row: {
          bimestre: number | null
          competencias: string[] | null
          created_at: string
          curso_plan_id: string
          descripcion: string | null
          duracion_estimada: number | null
          estandares: string[] | null
          id: string
          nombre: string
          objetivos: string | null
          orden: number
          tema_base_id: string | null
          updated_at: string
        }
        Insert: {
          bimestre?: number | null
          competencias?: string[] | null
          created_at?: string
          curso_plan_id: string
          descripcion?: string | null
          duracion_estimada?: number | null
          estandares?: string[] | null
          id?: string
          nombre: string
          objetivos?: string | null
          orden?: number
          tema_base_id?: string | null
          updated_at?: string
        }
        Update: {
          bimestre?: number | null
          competencias?: string[] | null
          created_at?: string
          curso_plan_id?: string
          descripcion?: string | null
          duracion_estimada?: number | null
          estandares?: string[] | null
          id?: string
          nombre?: string
          objetivos?: string | null
          orden?: number
          tema_base_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "temas_plan_curso_plan_id_fkey"
            columns: ["curso_plan_id"]
            isOneToOne: false
            referencedRelation: "cursos_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temas_plan_tema_base_id_fkey"
            columns: ["tema_base_id"]
            isOneToOne: false
            referencedRelation: "temas_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          id_institucion: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          id_institucion?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          id_institucion?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_institucion: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "profesor" | "alumno" | "apoderado"
      estado_clase:
        | "borrador"
        | "generando_clase"
        | "editando_guia"
        | "guia_aprobada"
        | "clase_programada"
        | "en_clase"
        | "completada"
        | "analizando_resultados"
      estado_quiz: "borrador" | "publicado" | "cerrado"
      estado_respuesta: "en_progreso" | "completado"
      plan_estado: "activo" | "borrador" | "pendiente"
      relacion_apoderado: "padre" | "madre" | "tutor"
      tipo_pregunta: "opcion_multiple" | "verdadero_falso" | "respuesta_corta"
      tipo_quiz: "previo" | "post"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "profesor", "alumno", "apoderado"],
      estado_clase: [
        "borrador",
        "generando_clase",
        "editando_guia",
        "guia_aprobada",
        "clase_programada",
        "en_clase",
        "completada",
        "analizando_resultados",
      ],
      estado_quiz: ["borrador", "publicado", "cerrado"],
      estado_respuesta: ["en_progreso", "completado"],
      plan_estado: ["activo", "borrador", "pendiente"],
      relacion_apoderado: ["padre", "madre", "tutor"],
      tipo_pregunta: ["opcion_multiple", "verdadero_falso", "respuesta_corta"],
      tipo_quiz: ["previo", "post"],
    },
  },
} as const

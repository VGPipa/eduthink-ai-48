/**
 * Exportación de Sesión de Clase a Word
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { SesionClaseData } from './ai/generate';

function createBorderedCell(text: string, options?: { bold?: boolean; bgColor?: string; width?: number }) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: options?.bold || false,
          }),
        ],
      }),
    ],
    width: options?.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options?.bgColor ? { fill: options.bgColor } : undefined,
  });
}

export async function exportarSesionWord(sesion: SesionClaseData, nombreArchivo?: string): Promise<void> {
  const doc = new Document({
    sections: [
      {
        children: [
          // Título principal
          new Paragraph({
            text: 'SESIÓN DE APRENDIZAJE',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Datos Generales
          new Paragraph({
            text: 'I. DATOS GENERALES',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createBorderedCell('Título de la sesión:', { bold: true, width: 25 }),
                  createBorderedCell(sesion.datos_generales.titulo_sesion, { width: 75 }),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Docente:', { bold: true }),
                  createBorderedCell(sesion.datos_generales.docente),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Fecha:', { bold: true }),
                  createBorderedCell(sesion.datos_generales.fecha),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Nivel:', { bold: true }),
                  createBorderedCell(sesion.datos_generales.nivel),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Grado:', { bold: true }),
                  createBorderedCell(sesion.datos_generales.grado),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Área académica:', { bold: true }),
                  createBorderedCell(sesion.datos_generales.area_academica),
                ],
              }),
            ],
          }),

          // Propósitos de Aprendizaje
          new Paragraph({
            text: 'II. PROPÓSITOS DE APRENDIZAJE',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createBorderedCell('Competencia', { bold: true, bgColor: 'FFFFCC', width: 25 }),
                  createBorderedCell('Criterios de evaluación', { bold: true, bgColor: 'FFFFCC', width: 25 }),
                  createBorderedCell('Evidencia de aprendizaje', { bold: true, bgColor: 'CCE5FF', width: 25 }),
                  createBorderedCell('Instrumentos de valorización', { bold: true, bgColor: 'CCE5FF', width: 25 }),
                ],
              }),
              ...sesion.propositos_aprendizaje.filas.map(fila => 
                new TableRow({
                  children: [
                    createBorderedCell(fila.competencia),
                    createBorderedCell(fila.criterios_evaluacion),
                    createBorderedCell(fila.evidencia_aprendizaje),
                    createBorderedCell(fila.instrumento_valorizacion),
                  ],
                })
              ),
            ],
          }),
          new Paragraph({
            spacing: { before: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createBorderedCell('Enfoques transversales', { bold: true, bgColor: 'CCFFCC', width: 30 }),
                  createBorderedCell(sesion.propositos_aprendizaje.enfoques_transversales.join(', '), { width: 70 }),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell('Descripción', { bold: true, bgColor: 'FFFFCC' }),
                  createBorderedCell(sesion.propositos_aprendizaje.descripcion_enfoques),
                ],
              }),
            ],
          }),

          // Preparación
          new Paragraph({
            text: 'III. PREPARACIÓN DE LA SESIÓN',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createBorderedCell('¿Qué necesitamos hacer antes de la sesión?', { bold: true, bgColor: 'FFE4CC', width: 50 }),
                  createBorderedCell('¿Qué recursos o materiales se utilizarán?', { bold: true, bgColor: 'FFE4CC', width: 50 }),
                ],
              }),
              new TableRow({
                children: [
                  createBorderedCell(sesion.preparacion.que_hacer_antes),
                  createBorderedCell(sesion.preparacion.recursos_materiales.join('\n• ')),
                ],
              }),
            ],
          }),

          // Momentos de la Sesión
          new Paragraph({
            text: 'IV. MOMENTOS DE LA SESIÓN',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          // INICIO
          new Paragraph({
            children: [
              new TextRun({ text: 'INICIO', bold: true }),
              new TextRun({ text: ` - ${sesion.momentos_sesion.inicio.tiempo_minutos} minutos` }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: sesion.momentos_sesion.inicio.contenido,
            spacing: { after: 200 },
          }),

          // DESARROLLO
          new Paragraph({
            children: [
              new TextRun({ text: 'DESARROLLO', bold: true }),
              new TextRun({ text: ` - ${sesion.momentos_sesion.desarrollo.tiempo_minutos} minutos` }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: sesion.momentos_sesion.desarrollo.contenido,
            spacing: { after: 200 },
          }),

          // CIERRE
          new Paragraph({
            children: [
              new TextRun({ text: 'CIERRE', bold: true }),
              new TextRun({ text: ` - ${sesion.momentos_sesion.cierre.tiempo_minutos} minutos` }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: sesion.momentos_sesion.cierre.contenido,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = nombreArchivo || `sesion_${sesion.datos_generales.titulo_sesion.replace(/\s+/g, '_')}.docx`;
  saveAs(blob, filename);
}

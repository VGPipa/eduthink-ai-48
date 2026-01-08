-- Insertar competencias de Matemática
INSERT INTO public.catalogo_competencias (area_curricular, nombre, descripcion, ciclo, activo)
VALUES 
  ('Matemática', 'Resuelve problemas de cantidad', 'Consiste en que el estudiante solucione problemas o plantee nuevos problemas que le demanden construir y comprender las nociones de cantidad, número, de sistemas numéricos, sus operaciones y propiedades.', NULL, true),
  ('Matemática', 'Resuelve problemas de regularidad, equivalencia y cambio', 'Consiste en que el estudiante logre caracterizar equivalencias y generalizar regularidades y el cambio de una magnitud con respecto de otra, a través de reglas generales que le permitan encontrar valores desconocidos.', NULL, true),
  ('Matemática', 'Resuelve problemas de forma, movimiento y localización', 'Consiste en que el estudiante se oriente y describa la posición y el movimiento de objetos y de sí mismo en el espacio, visualizando, interpretando y relacionando las características de los objetos con formas geométricas bidimensionales y tridimensionales.', NULL, true),
  ('Matemática', 'Resuelve problemas de gestión de datos e incertidumbre', 'Consiste en que el estudiante analice datos sobre un tema de interés o estudio o de situaciones aleatorias, que le permita tomar decisiones, elaborar predicciones razonables y conclusiones respaldadas en la información producida.', NULL, true);

-- Insertar capacidades para "Resuelve problemas de cantidad"
INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Traduce cantidades a expresiones numéricas', 'Transformar las relaciones entre los datos y condiciones de un problema a una expresión numérica que reproduzca las relaciones entre estos.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de cantidad' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Comunica su comprensión sobre los números y las operaciones', 'Expresar la comprensión de los conceptos numéricos, las operaciones y propiedades, las unidades de medida, las relaciones que establece entre ellos.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de cantidad' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Usa estrategias y procedimientos de estimación y cálculo', 'Seleccionar, adaptar, combinar o crear una variedad de estrategias, procedimientos como el cálculo mental y escrito, la estimación, la aproximación y medición.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de cantidad' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Argumenta afirmaciones sobre las relaciones numéricas y las operaciones', 'Elaborar afirmaciones sobre las posibles relaciones entre números naturales, enteros, racionales, reales, sus operaciones y propiedades.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de cantidad' AND area_curricular = 'Matemática';

-- Insertar capacidades para "Resuelve problemas de regularidad, equivalencia y cambio"
INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Traduce datos y condiciones a expresiones algebraicas y gráficas', 'Transformar los datos, valores desconocidos, variables y relaciones de un problema a una expresión gráfica o algebraica que generalice la interacción entre estos.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de regularidad, equivalencia y cambio' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Comunica su comprensión sobre las relaciones algebraicas', 'Expresar su comprensión de la noción, concepto o propiedades de los patrones, funciones, ecuaciones e inecuaciones estableciendo relaciones entre estas.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de regularidad, equivalencia y cambio' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Usa estrategias y procedimientos para encontrar equivalencias y reglas generales', 'Seleccionar, adaptar, combinar o crear procedimientos, estrategias y algunas propiedades para simplificar o transformar ecuaciones, inecuaciones y expresiones simbólicas.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de regularidad, equivalencia y cambio' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Argumenta afirmaciones sobre relaciones de cambio y equivalencia', 'Elaborar afirmaciones sobre variables, reglas algebraicas y propiedades algebraicas, razonando de manera inductiva para generalizar una regla y de manera deductiva probando y comprobando propiedades y nuevas relaciones.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de regularidad, equivalencia y cambio' AND area_curricular = 'Matemática';

-- Insertar capacidades para "Resuelve problemas de forma, movimiento y localización"
INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Modela objetos con formas geométricas y sus transformaciones', 'Construir un modelo que reproduzca las características de los objetos, su localización y movimiento, mediante formas geométricas, sus elementos y propiedades.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de forma, movimiento y localización' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Comunica su comprensión sobre las formas y relaciones geométricas', 'Comunicar su comprensión de las propiedades de las formas geométricas, sus transformaciones y la ubicación en un sistema de referencia.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de forma, movimiento y localización' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Usa estrategias y procedimientos para medir y orientarse en el espacio', 'Seleccionar, adaptar, combinar o crear una variedad de estrategias, procedimientos y recursos para construir formas geométricas, trazar rutas, medir o estimar distancias y superficies.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de forma, movimiento y localización' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Argumenta afirmaciones sobre relaciones geométricas', 'Elaborar afirmaciones sobre las posibles relaciones entre los elementos y las propiedades de las formas geométricas a partir de su exploración o visualización.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de forma, movimiento y localización' AND area_curricular = 'Matemática';

-- Insertar capacidades para "Resuelve problemas de gestión de datos e incertidumbre"
INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Representa datos con gráficos y medidas estadísticas o probabilísticas', 'Representar el comportamiento de un conjunto de datos, seleccionando tablas o gráficos estadísticos, medidas de tendencia central, de localización o dispersión.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de gestión de datos e incertidumbre' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Comunica su comprensión de los conceptos estadísticos y probabilísticos', 'Comunicar su comprensión de conceptos estadísticos y probabilísticos en relación a la situación. Leer, describir e interpretar información estadística contenida en gráficos o tablas.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de gestión de datos e incertidumbre' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Usa estrategias y procedimientos para recopilar y procesar datos', 'Seleccionar, adaptar, combinar o crear una variedad de procedimientos, estrategias y recursos para recopilar, procesar y analizar datos, así como el uso de técnicas de muestreo y el cálculo de las medidas estadísticas y probabilísticas.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de gestión de datos e incertidumbre' AND area_curricular = 'Matemática';

INSERT INTO public.catalogo_capacidades (id_competencia, nombre, descripcion, activo)
SELECT id, 'Sustenta conclusiones o decisiones con base en la información obtenida', 'Tomar decisiones, hacer predicciones o elaborar conclusiones y sustentarlas con base en la información obtenida del procesamiento y análisis de datos.', true
FROM public.catalogo_competencias WHERE nombre = 'Resuelve problemas de gestión de datos e incertidumbre' AND area_curricular = 'Matemática';
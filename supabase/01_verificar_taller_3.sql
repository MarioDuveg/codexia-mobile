-- CODEXIA Mobile Challenge = columna taller_3 de public.scores.
-- Solo verifica la estructura; NO borra ni modifica calificaciones.
-- Ejecutar en el SQL Editor de Supabase si deseas comprobarla.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'scores'
  and column_name in ('equipo', 'taller_3')
order by column_name;

-- Para revisar puntos registrados (solo lectura):
select equipo, taller_3 from public.scores order by equipo;

-- La app necesita SELECT, UPDATE de taller_3 y, para equipos nuevos,
-- INSERT sobre public.scores con políticas RLS que los permitan.
-- No se abren permisos nuevos automáticamente en este archivo.

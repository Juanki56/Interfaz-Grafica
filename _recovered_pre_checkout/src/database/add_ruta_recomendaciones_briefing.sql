-- Textos largos por ruta: recomendaciones para participantes y briefing interno para guías/equipo.
-- El backend MVC usa la tabla singular `ruta`. Migración canónica:
--   occitours-backend-mvc/database/migrations/2026-05-06_ruta_recomendaciones_briefing.sql

ALTER TABLE ruta
  ADD COLUMN IF NOT EXISTS recomendaciones_participantes TEXT,
  ADD COLUMN IF NOT EXISTS briefing_operativo_equipo TEXT;

COMMENT ON COLUMN ruta.recomendaciones_participantes IS 'Visible a clientes y en catálogo: recomendaciones generales de la salida.';
COMMENT ON COLUMN ruta.briefing_operativo_equipo IS 'Solo personal/guías: itinerario operativo, roles, horarios internos.';

-- Ejecutar en: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS mensajes (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  telefono    TEXT        NOT NULL,
  mensaje     TEXT        NOT NULL,
  origen      TEXT        NOT NULL DEFAULT 'whatsapp',
  leido       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_mensajes_telefono ON mensajes (telefono);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido    ON mensajes (leido);
CREATE INDEX IF NOT EXISTS idx_mensajes_created  ON mensajes (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- supabase_migration_v2.sql
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Idempotente: seguro de re-ejecutar en cualquier momento.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── integraciones: configuración de Evolution API y Google Calendar ──────────
-- Permite que el panel admin persista estas credenciales en Supabase
-- en lugar de localStorage (que no persiste entre sesiones ni browsers).

CREATE TABLE IF NOT EXISTS integraciones (
  franquicia_id             TEXT PRIMARY KEY DEFAULT '1',
  evolution_api_url         TEXT,
  evolution_api_key         TEXT,
  evolution_instance        TEXT,
  webhook_verify_token      TEXT,
  google_calendar_client_id TEXT,
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (solo usuarios autenticados pueden leer/escribir)
ALTER TABLE integraciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "integraciones_authenticated" ON integraciones;
CREATE POLICY "integraciones_authenticated"
  ON integraciones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Verificación post-ejecución ───────────────────────────────────────────────
-- Ejecutar esto para confirmar que la tabla quedó bien:
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'integraciones'
-- ORDER BY ordinal_position;

-- ── Papelera de conversaciones (soft-delete) ──────────────────────────────────
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE mensajes      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_deleted ON conversations (deleted_at);
CREATE INDEX IF NOT EXISTS idx_mensajes_deleted      ON mensajes      (deleted_at);

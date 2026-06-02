-- ─────────────────────────────────────────────────────────────────────────────
-- supabase_migration.sql
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Idempotente: seguro de re-ejecutar en cualquier momento.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── RESULTADO DEL AUDIT (2026-06-02) ─────────────────────────────────────────
-- Las tres tablas ya existen con todas sus columnas.
-- Este archivo corrige solo las POLÍTICAS RLS para que el panel admin
-- (usuarios autenticados) pueda hacer UPDATE y DELETE además de SELECT.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. inversores ─────────────────────────────────────────────────────────────
-- Problema: solo existe "inversores_read_authenticated" (SELECT).
-- El admin necesita UPDATE (editar leads, mover pipeline, soft-delete)
-- y DELETE (eliminar definitivamente desde la papelera).

DROP POLICY IF EXISTS "inversores_write_authenticated" ON inversores;
CREATE POLICY "inversores_write_authenticated"
  ON inversores
  FOR ALL                         -- SELECT + INSERT + UPDATE + DELETE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 2. reservas ──────────────────────────────────────────────────────────────
-- El admin crea, edita y arrastra reservas.
-- El bot escribe con service_role (bypasa RLS), pero el admin usa anon+auth.

DROP POLICY IF EXISTS "reservas_authenticated_all" ON reservas;
CREATE POLICY "reservas_authenticated_all"
  ON reservas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 3. configuracion_bot ─────────────────────────────────────────────────────
-- El Panel Admin hace upsert con onConflict='franquicia_id'.
-- Si RLS está activo sin política de escritura, el upsert falla silenciosamente.

ALTER TABLE configuracion_bot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracion_bot_authenticated_all" ON configuracion_bot;
CREATE POLICY "configuracion_bot_authenticated_all"
  ON configuracion_bot
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- service_role siempre bypasa RLS — no necesita política explícita.

-- ── Verificación post-ejecución ───────────────────────────────────────────────
-- Ejecutar esto para confirmar que las políticas quedaron bien:
--
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename IN ('inversores', 'reservas', 'configuracion_bot')
-- ORDER BY tablename, policyname;

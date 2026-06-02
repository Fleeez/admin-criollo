import React, { useState, useEffect } from 'react';
import { Bot, Save, Star, FileText, Link, Users, Zap, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const FRANQUICIA_ID = '1'; // string — coincide con columna TEXT en Supabase

export default function ConfiguracionBotTab({ addToast }) {
  const [botEncendido,    setBotEncendido]    = useState(true);
  const [reservasActivas, setReservasActivas] = useState(true);
  const [platoEstrella,   setPlatoEstrella]   = useState('');
  const [urlPdfMenu,      setUrlPdfMenu]      = useState('');
  const [preciosTexto,    setPreciosTexto]    = useState('');
  const [listaBlancaVip,  setListaBlancaVip]  = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [lastSaved,       setLastSaved]       = useState(null);
  const [isInitializing,  setIsInitializing]  = useState(true);
  const [loadError,       setLoadError]       = useState(null);
  const [retryKey,        setRetryKey]        = useState(0); // incrementar para reintentar

  // Carga inicial desde Supabase
  useEffect(() => {
    let mounted = true;

    async function cargarConfig() {
      try {
        const { data: rows, error } = await supabase
          .from('configuracion_bot')
          .select('*')
          .eq('franquicia_id', FRANQUICIA_ID)
          .limit(1);

        if (!mounted) return;

        if (error) {
          setLoadError(error.message);
          return;
        }

        const data = rows && rows.length > 0 ? rows[0] : null;
        if (data) {
          setBotEncendido(data.bot_encendido      ?? true);
          setReservasActivas(data.reservas_activas ?? true);
          setPlatoEstrella(data.plato_estrella     ?? '');
          setUrlPdfMenu(data.url_pdf_menu          ?? '');
          setPreciosTexto(data.precios_texto       ?? '');
          // lista_blanca_vip puede ser TEXT[] (array) o TEXT según el esquema — normalizar siempre a string
          const rawVip = data.lista_blanca_vip;
          setListaBlancaVip(Array.isArray(rawVip) ? rawVip.join('\n') : (rawVip ?? ''));
        }
      } catch (err) {
        if (mounted) setLoadError(err.message || 'Error desconocido');
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    cargarConfig();
    return () => { mounted = false; };
  }, [retryKey]);

  async function handleSave(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('configuracion_bot')
        .upsert(
          {
            franquicia_id:    FRANQUICIA_ID,
            bot_encendido:    botEncendido,
            reservas_activas: reservasActivas,
            plato_estrella:   platoEstrella.trim()   || null,
            url_pdf_menu:     urlPdfMenu.trim()       || null,
            precios_texto:    preciosTexto.trim()     || null,
            lista_blanca_vip: listaBlancaVip.trim()
              ? listaBlancaVip.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
              : [],
          },
          { onConflict: 'franquicia_id' }
        );

      if (error) throw error;
      setLastSaved(new Date());
      addToast('✓ Configuración de Bruno guardada');
    } catch (err) {
      addToast(`⚠️ Error al guardar: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 15 }}>
        Cargando configuración...
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{
          background: 'rgba(216,67,21,0.1)', border: '1px solid rgba(216,67,21,0.3)',
          borderRadius: 12, padding: '24px 28px',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--status-paused-text)', marginBottom: 8 }}>
            ⚠️ No se pudo cargar la configuración
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {loadError}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Si la tabla <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.1)', padding: '1px 5px', borderRadius: 4 }}>configuracion_bot</code> no existe aún, creala en Supabase con el SQL del README.
          </div>
          <button
            onClick={() => { setLoadError(null); setIsInitializing(true); setRetryKey(k => k + 1); }}
            style={{
              padding: '8px 18px', background: 'var(--accent-terracotta)', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="integrations-wrapper">

      {/* ── Status Cards ─────────────────────────────────────────────────────── */}
      <div className="card-grid" style={{ marginBottom: 4 }}>
        <div className="stat-card" style={{ borderLeft: `4px solid ${botEncendido ? 'var(--status-active-text)' : 'var(--status-paused-text)'}` }}>
          <div className="stat-header">
            <span className="stat-title">Estado de Bruno</span>
            <div className="stat-icon-wrapper"><Bot size={18} /></div>
          </div>
          <span className="stat-value" style={{ fontSize: 18, color: botEncendido ? 'var(--status-active-text)' : 'var(--status-paused-text)' }}>
            {botEncendido ? '● Activo' : '○ Pausado'}
          </span>
          <span className="stat-desc">
            {botEncendido ? 'Bruno responde mensajes automáticamente' : 'Bruno ignora todos los mensajes entrantes'}
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: `4px solid ${reservasActivas ? 'var(--status-active-text)' : 'var(--status-paused-text)'}` }}>
          <div className="stat-header">
            <span className="stat-title">Sistema de Reservas</span>
            <div className="stat-icon-wrapper"><Calendar size={18} /></div>
          </div>
          <span className="stat-value" style={{ fontSize: 18, color: reservasActivas ? 'var(--status-active-text)' : 'var(--status-paused-text)' }}>
            {reservasActivas ? '● Abierto' : '○ Cerrado'}
          </span>
          <span className="stat-desc">
            {reservasActivas ? 'Bruno acepta y gestiona reservas' : 'Bruno avisa que hoy no hay reservas disponibles'}
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Plato del Día</span>
            <div className="stat-icon-wrapper"><Star size={18} /></div>
          </div>
          <span className="stat-value" style={{ fontSize: 15, fontWeight: 600 }}>
            {platoEstrella || '—'}
          </span>
          <span className="stat-desc">Bruno lo recomendará proactivamente</span>
        </div>
      </div>

      <form onSubmit={handleSave}>

        {/* ── Sección 1: Control del Bot ─────────────────────────────────────── */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Bot size={22} color="var(--accent-terracotta)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Control del Bot</h3>
          </div>
          <p className="form-section-desc">
            Activa o desactiva Bruno y el sistema de reservas en tiempo real.
            Los cambios se aplican en el próximo mensaje que reciba el bot.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Bruno Activo</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Si está apagado, el bot ignora todos los mensajes entrantes sin excepción
              </div>
            </div>
            <label className="switch" style={{ flexShrink: 0, marginLeft: 24 }}>
              <input type="checkbox" checked={botEncendido} onChange={e => setBotEncendido(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Reservas Abiertas</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Si está apagado, Bruno avisa amablemente que hoy no se toman reservas
              </div>
            </div>
            <label className="switch" style={{ flexShrink: 0, marginLeft: 24 }}>
              <input type="checkbox" checked={reservasActivas} onChange={e => setReservasActivas(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* ── Sección 2: Carta y Precios ─────────────────────────────────────── */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FileText size={22} color="var(--accent-terracotta)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Carta y Precios</h3>
          </div>
          <p className="form-section-desc">
            Controlá el menú que Bruno leerá. Si completás los precios en texto libre,
            reemplaza la carta estructurada del sistema. Dejalo vacío para usar la carta original.
          </p>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">
                <Link size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                URL del Menú Digital / PDF
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://mi-menu.com/carta.pdf"
                value={urlPdfMenu}
                onChange={e => setUrlPdfMenu(e.target.value)}
              />
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                Bruno enviará este link cuando el cliente pida ver la carta
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Precios en Texto Libre (override)</label>
            <textarea
              className="form-input"
              rows={8}
              placeholder={'Ejemplos:\nEntradas:\n- Tabla Argenta: $2.800\n- Provoleta: $1.900\n\nPrincipales:\n- Bife de chorizo 400g: $4.500\n- Entraña 300g: $3.800'}
              value={preciosTexto}
              onChange={e => setPreciosTexto(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Si completás este campo, Bruno usará este texto como menú en lugar de la carta configurada en el sistema
            </span>
          </div>
        </div>

        {/* ── Sección 3: Plato Estrella ──────────────────────────────────────── */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Star size={22} color="var(--accent-gold)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Plato Estrella</h3>
          </div>
          <p className="form-section-desc">
            El plato que Bruno ofrecerá proactivamente cuando el cliente pregunte qué recomiendas,
            pida ver la carta o confirme una reserva.
          </p>

          <div className="form-group">
            <label className="form-label">
              <Zap size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Plato del Día
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej: Bife de chorizo 400g a la parrilla con chimichurri"
              value={platoEstrella}
              onChange={e => setPlatoEstrella(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Dejalo vacío para que Bruno no mencione ningún plato especial
            </span>
          </div>
        </div>

        {/* ── Sección 4: Lista Blanca VIP ────────────────────────────────────── */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Users size={22} color="var(--accent-olive)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Clientes VIP</h3>
          </div>
          <p className="form-section-desc">
            Estos números saltean las restricciones de disponibilidad. Bruno les dará prioridad
            aunque el local esté completo. Ingresá un número por línea o separados por coma.
          </p>

          <div className="form-group">
            <label className="form-label">
              <Users size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Números VIP (formato: +549XXXXXXXXXX)
            </label>
            <textarea
              className="form-input"
              rows={5}
              placeholder={'+5493512345678\n+5491155556789\n+5493351234000'}
              value={listaBlancaVip}
              onChange={e => setListaBlancaVip(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.8 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              {listaBlancaVip.trim()
                ? `${listaBlancaVip.split(/[\n,]+/).filter(l => l.trim()).length} número(s) configurado(s)`
                : 'Sin clientes VIP configurados'}
            </span>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 8 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <Save size={16} />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {lastSaved && (
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              Guardado a las {lastSaved.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

      </form>
    </div>
  );
}

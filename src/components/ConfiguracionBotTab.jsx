import React, { useState, useEffect } from 'react';
import { Bot, Save, Star, FileText, Link, Users, Zap, Calendar, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const FRANQUICIA_ID = 'demo-restaurant';

function parseStarDishes(val) {
  const empty = [{nombre:'',precio:''},{nombre:'',precio:''},{nombre:'',precio:''}];
  if (!val) return empty;
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      const filled = parsed.slice(0, 3).map(p => ({ nombre: p.nombre || '', precio: p.precio || '' }));
      while (filled.length < 3) filled.push({ nombre: '', precio: '' });
      return filled;
    }
    return [{ nombre: String(val), precio: '' }, { nombre: '', precio: '' }, { nombre: '', precio: '' }];
  } catch {
    return [{ nombre: String(val), precio: '' }, { nombre: '', precio: '' }, { nombre: '', precio: '' }];
  }
}

export default function ConfiguracionBotTab({ addToast }) {
  const [botEncendido,    setBotEncendido]    = useState(true);
  const [reservasActivas, setReservasActivas] = useState(true);
  const [platosEstrella,  setPlatosEstrella]  = useState([{nombre:'',precio:''},{nombre:'',precio:''},{nombre:'',precio:''}]);
  const [urlPdfMenu,      setUrlPdfMenu]      = useState('');
  const [preciosTexto,    setPreciosTexto]    = useState('');
  const [listaVip,        setListaVip]        = useState([]);
  const [newVipName,      setNewVipName]      = useState('');
  const [newVipPhone,     setNewVipPhone]     = useState('');
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [fechaInput,       setFechaInput]       = useState('');
  const [pdfUploading,     setPdfUploading]     = useState(false);
  const [isLoading,        setIsLoading]        = useState(false);
  const [lastSaved,        setLastSaved]        = useState(null);
  const [isInitializing,   setIsInitializing]   = useState(true);
  const [loadError,        setLoadError]        = useState(null);
  const [retryKey,         setRetryKey]         = useState(0);

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
          setPlatosEstrella(parseStarDishes(data.plato_estrella));
          setUrlPdfMenu(data.url_pdf_menu          ?? '');
          setPreciosTexto(data.precios_texto       ?? '');
          const rawVip = data.lista_blanca_vip;
          if (Array.isArray(rawVip)) {
            setListaVip(rawVip.map(entry =>
              typeof entry === 'object' && entry !== null
                ? { phone: String(entry.phone ?? ''), name: String(entry.name ?? 'VIP') }
                : { phone: String(entry), name: 'VIP' }
            ));
          }
          const rawFechas = data.fechas_bloqueadas;
          setFechasBloqueadas(Array.isArray(rawFechas) ? rawFechas : []);
        }
      } catch (err) {
        if (mounted) setLoadError(err.message || 'Error desconocido');
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }

    cargarConfig();

    const channel = supabase
      .channel('config-bot-live')
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'configuracion_bot',
        filter: `franquicia_id=eq.${FRANQUICIA_ID}`,
      }, (payload) => {
        if (!mounted) return;
        const raw = payload.new;
        if (Array.isArray(raw.lista_blanca_vip)) {
          setListaVip(raw.lista_blanca_vip.map(entry =>
            typeof entry === 'object' && entry !== null
              ? { phone: String(entry.phone ?? ''), name: String(entry.name ?? 'VIP') }
              : { phone: String(entry), name: 'VIP' }
          ));
        }
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
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
            plato_estrella:   (() => { const f = platosEstrella.filter(p => p.nombre.trim()); return f.length ? JSON.stringify(f) : null; })(),
            url_pdf_menu:     urlPdfMenu.trim()       || null,
            precios_texto:    preciosTexto.trim()     || null,
            lista_blanca_vip: listaVip.filter(v => v.phone.trim()),
            fechas_bloqueadas: fechasBloqueadas,
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

  async function handlePdfUpload(file) {
    setPdfUploading(true);
    try {
      const path = `franquicia-${FRANQUICIA_ID}/carta-menu.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('menus')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('menus').getPublicUrl(path);
      setUrlPdfMenu(data.publicUrl);
      addToast('✓ PDF subido — URL actualizada automáticamente');
    } catch (err) {
      addToast('⚠️ Error al subir PDF: ' + err.message);
    } finally {
      setPdfUploading(false);
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
            {platosEstrella.filter(p => p.nombre.trim()).map(p => p.nombre).join(', ') || '—'}
          </span>
          <span className="stat-desc">Bruno los recomendará proactivamente</span>
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

        {/* ── Sección 1b: Fechas Bloqueadas ─────────────────────────────────── */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Calendar size={22} color="var(--status-paused-text)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Fechas Bloqueadas</h3>
          </div>
          <p className="form-section-desc">
            Bloqueá días específicos en los que Bruno rechazará reservas aunque el toggle general esté activo.
            Útil para feriados, cierres temporales o eventos privados.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                const hoy = new Date().toISOString().split('T')[0];
                if (!fechasBloqueadas.includes(hoy)) setFechasBloqueadas(prev => [...prev, hoy].sort());
              }}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'rgba(216,67,21,0.1)', color: 'var(--status-paused-text)',
                border: '1px solid rgba(216,67,21,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              + Bloquear hoy
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="date"
                className="form-input"
                value={fechaInput}
                onChange={e => setFechaInput(e.target.value)}
                style={{ padding: '7px 10px', fontSize: 13, maxWidth: 180 }}
              />
              <button
                type="button"
                onClick={() => {
                  if (fechaInput && !fechasBloqueadas.includes(fechaInput)) {
                    setFechasBloqueadas(prev => [...prev, fechaInput].sort());
                    setFechaInput('');
                  }
                }}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent-olive)', color: '#fff',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                Agregar fecha
              </button>
            </div>
          </div>

          {fechasBloqueadas.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Sin fechas bloqueadas — las reservas están disponibles todos los días activos
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {fechasBloqueadas.map(fecha => (
                <div key={fecha} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 6px 4px 12px', borderRadius: 20,
                  background: 'rgba(216,67,21,0.1)', border: '1px solid rgba(216,67,21,0.22)',
                  fontSize: 13, fontWeight: 600, color: 'var(--status-paused-text)',
                }}>
                  {fecha.split('-').reverse().join('/')}
                  <button
                    type="button"
                    onClick={() => setFechasBloqueadas(prev => prev.filter(f => f !== fecha))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '1px 3px', color: 'var(--status-paused-text)',
                      display: 'flex', alignItems: 'center', opacity: 0.7,
                      fontFamily: 'inherit',
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  id="pdf-menu-upload"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) handlePdfUpload(e.target.files[0]); e.target.value = ''; }}
                />
                <label
                  htmlFor="pdf-menu-upload"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: pdfUploading ? 'var(--bg-primary)' : 'var(--accent-terracotta)',
                    color: pdfUploading ? 'var(--text-tertiary)' : '#fff',
                    border: pdfUploading ? '1px solid var(--border-color)' : '1px solid transparent',
                    cursor: pdfUploading ? 'not-allowed' : 'pointer',
                    pointerEvents: pdfUploading ? 'none' : 'auto',
                    transition: 'opacity 0.2s',
                    userSelect: 'none',
                  }}
                >
                  <Upload size={14} />
                  {pdfUploading ? 'Subiendo...' : 'Subir PDF'}
                </label>
                {urlPdfMenu && !pdfUploading && (
                  <a
                    href={urlPdfMenu}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent-terracotta)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    Ver PDF actual ↗
                  </a>
                )}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, display: 'block' }}>
                Podés ingresar la URL manualmente o subir el PDF directamente. Requiere bucket <code style={{ fontFamily: 'monospace' }}>menus</code> público en Supabase Storage.
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Actualizaciones y Extras del Menú</label>
            <textarea
              className="form-input"
              rows={8}
              placeholder={'Modificaciones o extras que se suman al menú del PDF:\nHoy no hay Bife de chorizo.\nEspecial del día: Costillar de cerdo $22.000\nTira de Asado 300g → precio actualizado: $32.000'}
              value={preciosTexto}
              onChange={e => setPreciosTexto(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Modificaciones de precios, platos agotados o especiales del día. Bruno combina esto con el menú del PDF. Si un plato aparece aquí y en el PDF, Bruno usa esta versión (más actualizada).
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
            Los platos que Bruno mencionará proactivamente cuando el cliente pida recomendaciones o consulte el menú. Podés cargar hasta 3 platos con su precio.
          </p>

          <div className="form-group">
            <label className="form-label">
              <Zap size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Platos Estrella (hasta 3)
            </label>
            {platosEstrella.map((plato, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Plato ${i + 1} — Ej: Bife de chorizo 400g`}
                  value={plato.nombre}
                  onChange={e => {
                    const updated = [...platosEstrella];
                    updated[i] = { ...updated[i], nombre: e.target.value };
                    setPlatosEstrella(updated);
                  }}
                  style={{ flex: 2 }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Precio — Ej: $32.000"
                  value={plato.precio}
                  onChange={e => {
                    const updated = [...platosEstrella];
                    updated[i] = { ...updated[i], precio: e.target.value };
                    setPlatosEstrella(updated);
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
              Dejá vacío para que Bruno no mencione platos especiales.
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
            Estos clientes saltean las restricciones de disponibilidad. Bruno los saluda por nombre
            y les da prioridad aunque el local esté completo.
          </p>

          {/* Lista existente */}
          {listaVip.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: 16 }}>
              Sin clientes VIP configurados
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {listaVip.map((vip, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                }}>
                  <Users size={15} color="var(--accent-olive)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', minWidth: 100 }}>
                    {vip.name}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'monospace', flex: 1 }}>
                    {vip.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => setListaVip(prev => prev.filter((_, j) => j !== i))}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                      color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center',
                      borderRadius: 6, fontFamily: 'inherit',
                    }}
                    title="Quitar VIP"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar nuevo VIP */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label className="form-label" style={{ fontSize: 11 }}>Nombre</label>
              <input
                type="text"
                className="form-input"
                placeholder="Juan Pérez"
                value={newVipName}
                onChange={e => setNewVipName(e.target.value)}
                style={{ padding: '7px 10px', fontSize: 13 }}
              />
            </div>
            <div style={{ flex: '2 1 180px' }}>
              <label className="form-label" style={{ fontSize: 11 }}>Teléfono (formato +549...)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+5491155556789"
                value={newVipPhone}
                onChange={e => setNewVipPhone(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const phone = newVipPhone.trim();
                    const name  = newVipName.trim() || 'VIP';
                    if (phone && !listaVip.some(v => v.phone === phone)) {
                      setListaVip(prev => [...prev, { phone, name }]);
                      setNewVipPhone('');
                      setNewVipName('');
                    }
                  }
                }}
                style={{ padding: '7px 10px', fontSize: 13, fontFamily: 'monospace' }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const phone = newVipPhone.trim();
                const name  = newVipName.trim() || 'VIP';
                if (phone && !listaVip.some(v => v.phone === phone)) {
                  setListaVip(prev => [...prev, { phone, name }]);
                  setNewVipPhone('');
                  setNewVipName('');
                }
              }}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--accent-olive)', color: '#fff',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                marginBottom: 1,
              }}
            >
              + Agregar VIP
            </button>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8, display: 'block' }}>
            {listaVip.length > 0
              ? `${listaVip.length} cliente(s) VIP — Bruno los saluda por nombre`
              : 'Ingresá nombre y teléfono para agregar un VIP'}
          </span>
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

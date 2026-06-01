import React, { useState, useEffect, useCallback } from 'react';
import { Users, ExternalLink, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ETAPA_STYLE = {
  'Completado': { backgroundColor: 'rgba(46,125,50,0.1)',  color: '#2E7D32' },
  'Paso 3':     { backgroundColor: 'rgba(216,67,21,0.1)',  color: '#D84315' },
  'Paso 2':     { backgroundColor: 'rgba(79,109,122,0.1)', color: '#4F6D7A' },
};
const DEFAULT_BADGE = { backgroundColor: '#EAE6DF', color: '#5C5854' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const INPUT_STYLE = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '13px',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const READONLY_STYLE = {
  ...INPUT_STYLE,
  backgroundColor: '#F0EDE8',
  color: 'var(--text-secondary)',
  cursor: 'default',
};

const LABEL_STYLE = {
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '5px',
  display: 'block',
};

const SECTION_TITLE_STYLE = {
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '14px',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--border-color)',
};

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}

function LeadModal({ lead, onClose, onSaved, addToast }) {
  const [form, setForm] = useState({
    nombre:              lead.nombre              || '',
    whatsapp:            lead.whatsapp            || '',
    capital_disponible:  lead.capital_disponible  || '',
    linkedin:            lead.linkedin            || '',
    zona_interes:        lead.zona_interes        || '',
    experiencia_previa:  lead.experiencia_previa  || '',
    detalle_experiencia: lead.detalle_experiencia || '',
    origen_lead:         lead.origen_lead         || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('inversores')
      .update(form)
      .eq('id', lead.id);
    setSaving(false);
    if (error) {
      addToast(`Error al guardar: ${error.message}`);
    } else {
      addToast('✓ Cambios guardados correctamente');
      onSaved({ ...lead, ...form });
      onClose();
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(30,28,26,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: '760px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="user-cell-avatar" style={{ width: '40px', height: '40px', fontSize: '16px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                {lead.nombre || lead.email}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Registrado {fmtDate(lead.created_at)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-tertiary)', padding: '6px', borderRadius: '8px',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Body scrollable */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Sección: Datos de contacto (editables) */}
          <div>
            <div style={{ ...SECTION_TITLE_STYLE, color: 'var(--accent-olive)' }}>
              Datos de contacto
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Nombre completo">
                <input style={INPUT_STYLE} value={form.nombre} onChange={set('nombre')} placeholder="Nombre" />
              </Field>
              <Field label="Email (no editable — identificador único)">
                <input style={READONLY_STYLE} value={lead.email || ''} readOnly />
              </Field>
              <Field label="WhatsApp">
                <input style={INPUT_STYLE} value={form.whatsapp} onChange={set('whatsapp')} placeholder="+54 9 11..." />
              </Field>
              <Field label="Capital Disponible">
                <input style={INPUT_STYLE} value={form.capital_disponible} onChange={set('capital_disponible')} placeholder="USD..." />
              </Field>
            </div>
          </div>

          {/* Sección: Perfil profesional (editables) */}
          <div>
            <div style={{ ...SECTION_TITLE_STYLE, color: 'var(--accent-olive)' }}>
              Perfil profesional
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="LinkedIn">
                <input style={INPUT_STYLE} value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." />
              </Field>
              <Field label="Zona de Interés">
                <input style={INPUT_STYLE} value={form.zona_interes} onChange={set('zona_interes')} placeholder="CABA, GBA, Interior..." />
              </Field>
              <Field label="Experiencia Previa">
                <input style={INPUT_STYLE} value={form.experiencia_previa} onChange={set('experiencia_previa')} placeholder="Sí / No" />
              </Field>
              <Field label="Origen Lead">
                <input style={INPUT_STYLE} value={form.origen_lead} onChange={set('origen_lead')} placeholder="Instagram, referido..." />
              </Field>
              <Field label="Detalle de experiencia">
                <textarea
                  style={{ ...INPUT_STYLE, minHeight: '80px', resize: 'vertical' }}
                  value={form.detalle_experiencia}
                  onChange={set('detalle_experiencia')}
                  placeholder="Descripción de experiencia previa..."
                />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
                {lead.documento_pdf_url && (
                  <a href={lead.documento_pdf_url} target="_blank" rel="noreferrer"
                    className="btn-link"
                    style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Ver Dossier PDF
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Datos legales (solo lectura) */}
          <div>
            <div style={{ ...SECTION_TITLE_STYLE, color: 'var(--accent-terracotta)' }}>
              ⚖ Datos Legales — Solo lectura
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Estado NDA">
                <input style={READONLY_STYLE} value={lead.estado_nda || '—'} readOnly />
              </Field>
              <Field label="Fecha de Firma del NDA">
                <input style={READONLY_STYLE} value={fmtDate(lead.fecha_firma)} readOnly />
              </Field>
              <Field label="IP del Firmante">
                <input style={READONLY_STYLE} value={lead.ip_firmante || '—'} readOnly />
              </Field>
              <Field label="Dispositivo">
                <input style={READONLY_STYLE} value={lead.dispositivo || '—'} readOnly />
              </Field>
            </div>
          </div>

          {/* Sección: Sistema (solo lectura) */}
          <div>
            <div style={{ ...SECTION_TITLE_STYLE, color: 'var(--text-tertiary)' }}>
              Sistema — Solo lectura
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <Field label="ID">
                <input style={READONLY_STYLE} value={String(lead.id)} readOnly />
              </Field>
              <Field label="Etapa del formulario">
                <input style={READONLY_STYLE} value={lead.etapa_formulario || '—'} readOnly />
              </Field>
              <Field label="Última actualización">
                <input style={READONLY_STYLE} value={fmtDate(lead.updated_at)} readOnly />
              </Field>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          padding: '16px 28px',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0,
          backgroundColor: 'var(--bg-primary)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: '1px solid var(--border-color)', backgroundColor: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
              border: 'none', backgroundColor: 'var(--accent-olive)',
              color: '#fff', cursor: saving ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InversoresTab({ addToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    supabase
      .from('inversores')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[Inversores] Error cargando leads:', error);
        setLeads(data || []);
        setLoading(false);
      });

    const channel = supabase
      .channel('inversores-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inversores' }, ({ new: row }) => {
        setLeads(prev => [row, ...prev]);
        addToast(`🆕 Nuevo lead: ${row.nombre || row.email}`);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleSaved = useCallback((updatedLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
  }, []);

  return (
    <div className="dashboard-view">
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total leads</span>
            <div className="stat-icon-wrapper"><Users size={18} /></div>
          </div>
          <span className="stat-value">{leads.length}</span>
          <span className="stat-desc">Registros en la base</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">NDA Firmados</span>
            <div className="stat-icon-wrapper"><Users size={18} /></div>
          </div>
          <span className="stat-value">{leads.filter(l => l.estado_nda === 'Firmado').length}</span>
          <span className="stat-desc">Acuerdo de confidencialidad</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Completos</span>
            <div className="stat-icon-wrapper"><Users size={18} /></div>
          </div>
          <span className="stat-value">{leads.filter(l => l.etapa_formulario === 'Completado').length}</span>
          <span className="stat-desc">Formulario terminado</span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title">Leads de inversores</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {loading ? 'Cargando...' : `${leads.length} registros — click en fila para editar`}
          </span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Capital</th>
                <th>Etapa</th>
                <th>NDA</th>
                <th>PDF</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{ cursor: 'pointer' }}
                  title="Click para ver y editar todos los datos"
                >
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">
                        {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{lead.nombre || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{lead.email || '—'}</td>
                  <td>{lead.whatsapp || '—'}</td>
                  <td>{lead.capital_disponible || '—'}</td>
                  <td>
                    <span className="badge" style={ETAPA_STYLE[lead.etapa_formulario] || DEFAULT_BADGE}>
                      {lead.etapa_formulario || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={lead.estado_nda === 'Firmado'
                      ? { backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32' }
                      : DEFAULT_BADGE}>
                      {lead.estado_nda || '—'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {lead.documento_pdf_url
                      ? (
                        <a href={lead.documento_pdf_url} target="_blank" rel="noreferrer"
                          className="btn-link" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ExternalLink size={13} /> Ver
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {fmtDate(lead.created_at)}
                  </td>
                </tr>
              ))}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    Sin leads registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSaved={handleSaved}
          addToast={addToast}
        />
      )}
    </div>
  );
}

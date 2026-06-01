import React, { useState, useEffect } from 'react';
import { Users, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
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

function DetailField({ label, value, fullWidth }) {
  return (
    <div style={{
      gridColumn: fullWidth ? '1 / -1' : undefined,
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4', wordBreak: 'break-word' }}>
        {value || '—'}
      </span>
    </div>
  );
}

function LeadDetailPanel({ lead }) {
  return (
    <tr>
      <td colSpan={9} style={{ padding: 0, borderTop: 'none' }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '2px solid var(--accent-gold)',
          padding: '20px 24px',
        }}>
          {/* Sección Legal */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--accent-terracotta)',
              textTransform: 'uppercase', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px'
            }}>
              ⚖ Datos Legales — NDA
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <DetailField label="Estado NDA" value={lead.estado_nda} />
              <DetailField label="Fecha de Firma" value={fmtDate(lead.fecha_firma)} />
              <DetailField label="IP del Firmante" value={lead.ip_firmante} />
              <DetailField label="Dispositivo" value={lead.dispositivo} />
            </div>
          </div>

          {/* Sección Perfil */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--accent-olive)',
              textTransform: 'uppercase', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px'
            }}>
              👤 Perfil Profesional
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <DetailField label="Zona de Interés" value={lead.zona_interes} />
              <DetailField label="Experiencia Previa" value={lead.experiencia_previa} />
              <DetailField label="Origen Lead" value={lead.origen_lead} />
              {lead.linkedin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LinkedIn</span>
                  <a href={lead.linkedin} target="_blank" rel="noreferrer"
                    className="btn-link" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ExternalLink size={12} /> Ver perfil
                  </a>
                </div>
              )}
              {!lead.linkedin && <DetailField label="LinkedIn" value={null} />}
              <DetailField label="Detalle Experiencia" value={lead.detalle_experiencia} fullWidth={true} />
            </div>
          </div>

          {/* Sección Sistema */}
          <div>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '1px',
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px'
            }}>
              🗂 Sistema
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <DetailField label="ID" value={String(lead.id)} />
              <DetailField label="Registrado" value={fmtDate(lead.created_at)} />
              <DetailField label="Última actualización" value={fmtDate(lead.updated_at)} />
              <DetailField label="Etapa del formulario" value={lead.etapa_formulario} />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function InversoresTab({ addToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

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
            {loading ? 'Cargando...' : `${leads.length} registros — click en fila para ver detalle legal`}
          </span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}></th>
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
                <React.Fragment key={lead.id}>
                  <tr
                    onClick={() => toggleExpand(lead.id)}
                    style={{ cursor: 'pointer' }}
                    title="Click para ver todos los datos legales"
                  >
                    <td style={{ color: 'var(--text-tertiary)', paddingRight: 0 }}>
                      {expandedId === lead.id
                        ? <ChevronDown size={15} />
                        : <ChevronRight size={15} />}
                    </td>
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
                  {expandedId === lead.id && <LeadDetailPanel lead={lead} />}
                </React.Fragment>
              ))}
              {!loading && leads.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    Sin leads registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

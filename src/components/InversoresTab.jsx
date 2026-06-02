import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ExternalLink, X, Save,
  Table2, Calendar, LayoutGrid,
  ChevronDown, ChevronRight, ChevronLeft,
  Search, MessageCircle, TrendingUp,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// ── Estilos compartidos ─────────────────────────────────────

const ETAPA_STYLE = {
  'Completado': { backgroundColor: 'rgba(46,125,50,0.1)',  color: '#2E7D32' },
  'Paso 3':     { backgroundColor: 'rgba(216,67,21,0.1)',  color: '#D84315' },
  'Paso 2':     { backgroundColor: 'rgba(79,109,122,0.1)', color: '#4F6D7A' },
};
const DEFAULT_BADGE = { backgroundColor: '#EAE6DF', color: '#5C5854' };

function getCapitalTier(text) {
  if (!text) return null;
  const nums = (text.match(/\d+/g) || []).map(Number);
  const max  = nums.length ? Math.max(...nums) : 0;
  if (max >= 200) return { tier: 'Premium / Multiunit', bg: 'rgba(212,163,115,0.25)', color: '#8B6914', border: '1px solid rgba(212,163,115,0.5)' };
  if (max >= 100) return { tier: 'Avenida',             bg: 'rgba(156,163,175,0.2)',  color: '#6B7280', border: '1px solid rgba(156,163,175,0.4)' };
  if (max > 0)    return { tier: 'Express',             bg: 'rgba(180,83,9,0.15)',    color: '#B45309', border: '1px solid rgba(180,83,9,0.3)'  };
  return null;
}

function calcCapitalPipeline(leads) {
  let total = 0;
  leads.forEach(l => {
    const nums = ((l.capital_disponible || '').match(/\d+/g) || []).map(Number);
    if (nums.length) total += nums.reduce((a, b) => a + b, 0) / nums.length;
  });
  if (total >= 1000) return `$${(total / 1000).toFixed(1)}M`;
  return total > 0 ? `$${Math.round(total)}k` : '$0k';
}

const KANBAN_COLS = [
  { id: 'Sin contactar',    bg: '#EAE6DF',                       text: '#5C5854'  },
  { id: 'Contactado',       bg: 'rgba(79,109,122,0.12)',          text: '#3E5661'  },
  { id: 'Reunión Agendada', bg: 'rgba(212,163,115,0.18)',         text: '#8B6914'  },
  { id: 'Finalizado',       bg: 'rgba(46,125,50,0.1)',            text: '#2E7D32'  },
  { id: 'Cancelado',        bg: 'rgba(216,67,21,0.1)',            text: '#D84315'  },
];

const INPUT_STYLE = {
  width: '100%', padding: '8px 12px', fontSize: '13px',
  border: '1px solid var(--border-color)', borderRadius: '8px',
  backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
  fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
};
const READONLY_STYLE = { ...INPUT_STYLE, backgroundColor: '#F0EDE8', color: 'var(--text-secondary)', cursor: 'default' };
const LABEL_STYLE = { fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', display: 'block' };
const SEC_TITLE   = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' };
const NAV_BTN     = { background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column' }}><label style={LABEL_STYLE}>{label}</label>{children}</div>;
}

// ── LeadModal ───────────────────────────────────────────────

function LeadModal({ lead, onClose, onSaved, addToast }) {
  const [form, setForm] = useState({
    nombre: lead.nombre || '', whatsapp: lead.whatsapp || '',
    capital_disponible: lead.capital_disponible || '', linkedin: lead.linkedin || '',
    zona_interes: lead.zona_interes || '', experiencia_previa: lead.experiencia_previa || '',
    detalle_experiencia: lead.detalle_experiencia || '', origen_lead: lead.origen_lead || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('inversores').update(form).eq('id', lead.id);
    setSaving(false);
    if (error) { addToast(`Error al guardar: ${error.message}`); }
    else { addToast('✓ Cambios guardados'); onSaved({ ...lead, ...form }); onClose(); }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(30,28,26,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '760px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', fontSize: '16px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{lead.nombre || lead.email}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Registrado {fmtDate(lead.created_at)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <div style={{ ...SEC_TITLE, color: 'var(--accent-olive)' }}>Datos de contacto</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Nombre completo"><input style={INPUT_STYLE} value={form.nombre} onChange={set('nombre')} placeholder="Nombre" /></Field>
              <Field label="Email (identificador único)"><input style={READONLY_STYLE} value={lead.email || ''} readOnly /></Field>
              <Field label="WhatsApp"><input style={INPUT_STYLE} value={form.whatsapp} onChange={set('whatsapp')} placeholder="+54 9 11..." /></Field>
              <Field label="Capital Disponible"><input style={INPUT_STYLE} value={form.capital_disponible} onChange={set('capital_disponible')} placeholder="USD..." /></Field>
            </div>
          </div>
          <div>
            <div style={{ ...SEC_TITLE, color: 'var(--accent-olive)' }}>Perfil profesional</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="LinkedIn"><input style={INPUT_STYLE} value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/..." /></Field>
              <Field label="Zona de Interés"><input style={INPUT_STYLE} value={form.zona_interes} onChange={set('zona_interes')} placeholder="CABA, GBA..." /></Field>
              <Field label="Experiencia Previa"><input style={INPUT_STYLE} value={form.experiencia_previa} onChange={set('experiencia_previa')} placeholder="Sí / No" /></Field>
              <Field label="Origen Lead"><input style={INPUT_STYLE} value={form.origen_lead} onChange={set('origen_lead')} placeholder="Instagram, referido..." /></Field>
              <Field label="Detalle de experiencia"><textarea style={{ ...INPUT_STYLE, minHeight: '80px', resize: 'vertical' }} value={form.detalle_experiencia} onChange={set('detalle_experiencia')} placeholder="Descripción..." /></Field>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {lead.documento_pdf_url && (
                  <a href={lead.documento_pdf_url} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', textDecoration: 'none' }}>
                    <ExternalLink size={14} /> Ver Dossier PDF
                  </a>
                )}
              </div>
            </div>
          </div>
          <div>
            <div style={{ ...SEC_TITLE, color: 'var(--accent-terracotta)' }}>⚖ Datos Legales — Solo lectura</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Estado NDA"><input style={READONLY_STYLE} value={lead.estado_nda || '—'} readOnly /></Field>
              <Field label="Fecha de Firma del NDA"><input style={READONLY_STYLE} value={fmtDate(lead.fecha_firma)} readOnly /></Field>
              <Field label="IP del Firmante"><input style={READONLY_STYLE} value={lead.ip_firmante || '—'} readOnly /></Field>
              <Field label="Dispositivo"><input style={READONLY_STYLE} value={lead.dispositivo || '—'} readOnly /></Field>
            </div>
          </div>
          <div>
            <div style={{ ...SEC_TITLE, color: 'var(--text-tertiary)' }}>Sistema — Solo lectura</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <Field label="ID"><input style={READONLY_STYLE} value={String(lead.id)} readOnly /></Field>
              <Field label="Etapa del formulario"><input style={READONLY_STYLE} value={lead.etapa_formulario || '—'} readOnly /></Field>
              <Field label="Última actualización"><input style={READONLY_STYLE} value={fmtDate(lead.updated_at)} readOnly /></Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 28px', borderTop: '1px solid var(--border-color)', flexShrink: 0, backgroundColor: 'var(--bg-primary)' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', backgroundColor: 'var(--accent-olive)', color: '#fff', cursor: saving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '7px', opacity: saving ? 0.7 : 1 }}>
            <Save size={14} />{saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CalendarioView ──────────────────────────────────────────

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const offset   = (firstDay.getDay() + 6) % 7; // Monday-first
  const days = [];
  for (let i = offset - 1; i >= 0; i--)
    days.push({ date: new Date(year, month, -i), current: false });
  for (let d = 1; d <= lastDay.getDate(); d++)
    days.push({ date: new Date(year, month, d), current: true });
  const rem = 7 - (days.length % 7);
  if (rem < 7)
    for (let d = 1; d <= rem; d++)
      days.push({ date: new Date(year, month + 1, d), current: false });
  return days;
}

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function CalendarioView({ leads, onSchedule, onOpenModal, addToast }) {
  const now = new Date();
  const [year,       setYear]       = useState(now.getFullYear());
  const [month,      setMonth]      = useState(now.getMonth());
  const [dropIdx,    setDropIdx]    = useState(null);
  const [timeLead,   setTimeLead]   = useState(null);
  const [timeValue,  setTimeValue]  = useState('');

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const days            = buildCalendarDays(year, month);
  const scheduledLeads  = leads.filter(l => l.videocall_date);
  const unscheduled     = leads.filter(l => !l.videocall_date);

  const handleDrop = (e, date) => {
    e.preventDefault(); setDropIdx(null);
    const leadId = Number(e.dataTransfer.getData('text/plain'));
    if (!leadId) return;
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T12:00:00`;
    onSchedule(leadId, iso);
    addToast('📅 Videollamada agendada');
  };

  const openTime = (lead) => {
    setTimeLead(lead);
    const d = new Date(lead.videocall_date);
    setTimeValue(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
  };

  return (
    <div className="section-card">
      {/* Navegación de mes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={prevMonth} style={NAV_BTN}><ChevronLeft size={16} /></button>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{MONTHS_ES[month]} {year}</span>
        <button onClick={nextMonth} style={NAV_BTN}><ChevronRight size={16} /></button>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Sidebar: sin agendar */}
        <div style={{ width: '210px', flexShrink: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Sin agendar ({unscheduled.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '500px', overflowY: 'auto' }}>
            {unscheduled.length === 0
              ? <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '14px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>Todos agendados ✓</div>
              : unscheduled.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('text/plain', String(lead.id))}
                  style={{ padding: '9px 11px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: 'grab', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '9px' }}
                >
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                    {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.nombre || lead.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{lead.capital_disponible || '—'}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Grilla de calendario */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
            {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d =>
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0' }}>{d}</div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
            {days.map((day, idx) => {
              const dayLeads = scheduledLeads.filter(l => isSameDay(new Date(l.videocall_date), day.date));
              const isToday  = isSameDay(day.date, now);
              const isDrop   = dropIdx === idx;
              return (
                <div
                  key={idx}
                  onDragOver={e => { e.preventDefault(); setDropIdx(idx); }}
                  onDragLeave={() => setDropIdx(null)}
                  onDrop={e => handleDrop(e, day.date)}
                  style={{
                    minHeight: '68px', padding: '4px', borderRadius: '8px',
                    backgroundColor: isDrop ? 'rgba(212,163,115,0.15)' : day.current ? 'var(--bg-primary)' : 'transparent',
                    border: isDrop ? '2px dashed var(--accent-gold)' : `1px solid ${day.current ? 'var(--border-color)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: '12px', fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#fff' : day.current ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isToday ? 'var(--accent-olive)' : 'transparent', marginBottom: '3px',
                  }}>
                    {day.date.getDate()}
                  </div>
                  {dayLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', String(lead.id)); }}
                      onClick={() => openTime(lead)}
                      title={`${lead.nombre || lead.email} — ${fmtTime(lead.videocall_date)} · Click para editar hora`}
                      style={{ fontSize: '10px', padding: '2px 5px', borderRadius: '5px', backgroundColor: 'rgba(79,109,122,0.15)', color: 'var(--accent-olive)', marginBottom: '2px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}
                    >
                      {fmtTime(lead.videocall_date)} {lead.nombre || lead.email}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de hora */}
      {timeLead && (
        <div onClick={() => setTimeLead(null)} style={{ position: 'fixed', inset: 0, zIndex: 1001, backgroundColor: 'rgba(30,28,26,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '28px', width: '360px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>Videollamada: {timeLead.nombre || timeLead.email}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '20px' }}>Ajustá la fecha y hora exacta</div>
            <label style={LABEL_STYLE}>Fecha y hora</label>
            <input type="datetime-local" value={timeValue} onChange={e => setTimeValue(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { onSchedule(timeLead.id, null); addToast('📅 Removido del calendario'); setTimeLead(null); }} style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Quitar
              </button>
              <button onClick={() => { if (timeValue) { onSchedule(timeLead.id, new Date(timeValue).toISOString()); addToast('✓ Hora actualizada'); setTimeLead(null); } }} style={{ flex: 1, padding: '9px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', backgroundColor: 'var(--accent-olive)', color: '#fff', cursor: 'pointer' }}>
                Guardar hora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PipelineView ────────────────────────────────────────────

function PipelineView({ leads, onMoveColumn, onOpenModal }) {
  const [dropCol,      setDropCol]      = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  const leadsFor = (colId) => leads.filter(l => (l.estado_lead || 'Sin contactar') === colId);

  const handleDrop = (e, colId) => {
    e.preventDefault(); setDropCol(null);
    const leadId = Number(e.dataTransfer.getData('text/plain'));
    if (!leadId) return;
    onMoveColumn(leadId, colId);
  };

  return (
    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', alignItems: 'flex-start' }}>
      {KANBAN_COLS.map(col => {
        const colLeads = leadsFor(col.id);
        const isDrop   = dropCol === col.id;
        return (
          <div
            key={col.id}
            onDragOver={e => { e.preventDefault(); setDropCol(col.id); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropCol(null); }}
            onDrop={e => handleDrop(e, col.id)}
            style={{
              width: '230px', flexShrink: 0, borderRadius: '14px',
              backgroundColor: isDrop ? 'rgba(212,163,115,0.12)' : col.bg,
              border: isDrop ? '2px dashed var(--accent-gold)' : '2px solid transparent',
              padding: '12px', transition: 'all 0.15s', minHeight: '180px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: col.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col.id}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.08)', color: col.text, borderRadius: '10px', padding: '2px 7px' }}>{colLeads.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {colLeads.map(lead => {
                const isExp = expandedCard === lead.id;
                return (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={e => { e.dataTransfer.setData('text/plain', String(lead.id)); e.dataTransfer.effectAllowed = 'move'; }}
                    style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)', padding: '10px 12px', cursor: 'grab', userSelect: 'none', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        {(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.nombre || lead.email || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{lead.capital_disponible || '—'}</div>
                        {lead.estado_nda && (
                          <span style={{ ...(lead.estado_nda === 'Firmado' ? { backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32' } : DEFAULT_BADGE), fontSize: '10px', padding: '2px 7px', borderRadius: '8px', display: 'inline-block', marginTop: '4px' }}>
                            {lead.estado_nda}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setExpandedCard(isExp ? null : lead.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', flexShrink: 0, display: 'flex' }}
                      >
                        {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>

                    {isExp && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[['Email', lead.email], ['WhatsApp', lead.whatsapp], ['Zona', lead.zona_interes], ['Etapa', lead.etapa_formulario]].map(([lbl, val]) =>
                          val ? (
                            <div key={lbl} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-tertiary)', marginRight: '4px' }}>{lbl}:</span>{val}
                            </div>
                          ) : null
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={e => { e.stopPropagation(); onOpenModal(lead); }}
                            className="btn-link"
                            style={{ fontSize: '12px', fontWeight: 600 }}
                          >
                            Ver/Editar →
                          </button>
                          {lead.documento_pdf_url && (
                            <a href={lead.documento_pdf_url} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} onClick={e => e.stopPropagation()}>
                              <ExternalLink size={11} /> PDF
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {colLeads.length === 0 && !isDrop && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  Sin leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── InversoresTab ───────────────────────────────────────────

const VIEWS = [
  { id: 'tabla',      label: 'Tabla',      Icon: Table2 },
  { id: 'calendario', label: 'Calendario', Icon: Calendar },
  { id: 'pipeline',   label: 'Pipeline',   Icon: LayoutGrid },
];

export default function InversoresTab({ addToast }) {
  const [leads,        setLeads]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeView,   setActiveView]   = useState('tabla');
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery,  setSearchQuery]  = useState('');

  useEffect(() => {
    supabase.from('inversores').select('*').order('created_at', { ascending: false })
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inversores' }, ({ new: row }) => {
        setLeads(prev => prev.map(l => l.id === row.id ? row : l));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleSaved = useCallback((updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  }, []);

  const handleSchedule = useCallback(async (leadId, isoDatetime) => {
    const { error } = await supabase.from('inversores').update({ videocall_date: isoDatetime }).eq('id', leadId);
    if (!error) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, videocall_date: isoDatetime } : l));
  }, []);

  const handleMoveColumn = useCallback(async (leadId, newColumn) => {
    const { error } = await supabase.from('inversores').update({ estado_lead: newColumn }).eq('id', leadId);
    if (!error) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, estado_lead: newColumn } : l));
  }, []);

  const handleStatusChange = useCallback(async (leadId, field, newValue) => {
    const { error } = await supabase.from('inversores').update({ [field]: newValue }).eq('id', leadId);
    if (!error) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: newValue } : l));
  }, []);

  const filteredLeads = leads.filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (l.nombre || '').toLowerCase().includes(q) || (l.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="dashboard-view">
      {/* Stats */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-title">Total leads</span><div className="stat-icon-wrapper"><Users size={18} /></div></div>
          <span className="stat-value">{leads.length}</span>
          <span className="stat-desc">Registros en la base</span>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-title">NDA Firmados</span><div className="stat-icon-wrapper"><Users size={18} /></div></div>
          <span className="stat-value">{leads.filter(l => l.estado_nda === 'Firmado').length}</span>
          <span className="stat-desc">Acuerdo de confidencialidad</span>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-title">Completos</span><div className="stat-icon-wrapper"><Users size={18} /></div></div>
          <span className="stat-value">{leads.filter(l => l.etapa_formulario === 'Completado').length}</span>
          <span className="stat-desc">Formulario terminado</span>
        </div>
        <div className="stat-card">
          <div className="stat-header"><span className="stat-title">Capital en Pipeline</span><div className="stat-icon-wrapper"><TrendingUp size={18} /></div></div>
          <span className="stat-value" style={{ fontSize: 28 }}>{calcCapitalPipeline(leads)}</span>
          <span className="stat-desc">Estimado agregado del pipeline</span>
        </div>
      </div>

      {/* Selector de vista */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
        {VIEWS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveView(id)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            border: activeView === id ? 'none' : '1px solid var(--border-color)',
            backgroundColor: activeView === id ? 'var(--accent-olive)' : 'transparent',
            color: activeView === id ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Vista Tabla */}
      {activeView === 'tabla' && (
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Leads de inversores</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {loading
                ? 'Cargando...'
                : searchQuery.trim()
                  ? `${filteredLeads.length} de ${leads.length} — click en fila para editar`
                  : `${leads.length} registros — click en fila para editar`}
            </span>
          </div>

          {/* Buscador */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ ...INPUT_STYLE, paddingLeft: 34, paddingRight: 12 }}
            />
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>WhatsApp</th><th>Capital</th><th>Etapa</th><th>NDA</th><th>PDF</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)} style={{ cursor: 'pointer' }} title="Click para editar">
                    <td><div className="user-cell"><div className="user-cell-avatar">{(lead.nombre || lead.email || '?').charAt(0).toUpperCase()}</div><span style={{ fontWeight: 600 }}>{lead.nombre || '—'}</span></div></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lead.email || '—'}</td>

                    {/* WhatsApp — enlace directo a wa.me */}
                    <td onClick={e => e.stopPropagation()}>
                      {lead.whatsapp ? (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#25D366', fontWeight: 500, fontSize: 13, textDecoration: 'none', transition: 'opacity 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <MessageCircle size={13} /> {lead.whatsapp}
                        </a>
                      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                    </td>

                    {/* Capital — badge de tier + rango en texto pequeño */}
                    <td>
                      {(() => {
                        const t = getCapitalTier(lead.capital_disponible);
                        if (!t) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: t.bg, color: t.color, border: t.border, whiteSpace: 'nowrap' }}>
                              {t.tier}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{lead.capital_disponible}</span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Etapa — select inline estilizado como badge */}
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.etapa_formulario || ''}
                        onChange={e => handleStatusChange(lead.id, 'etapa_formulario', e.target.value)}
                        style={{
                          ...(ETAPA_STYLE[lead.etapa_formulario] || DEFAULT_BADGE),
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                          appearance: 'none', WebkitAppearance: 'none',
                        }}
                      >
                        {['Paso 1', 'Paso 2', 'Paso 3', 'Completado'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>

                    {/* NDA — select inline estilizado como badge */}
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        value={lead.estado_nda || ''}
                        onChange={e => handleStatusChange(lead.id, 'estado_nda', e.target.value)}
                        style={{
                          ...(lead.estado_nda === 'Firmado'
                            ? { backgroundColor: 'rgba(46,125,50,0.1)', color: '#2E7D32' }
                            : DEFAULT_BADGE),
                          padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                          appearance: 'none', WebkitAppearance: 'none',
                        }}
                      >
                        {['Pendiente', 'Firmado'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>

                    <td onClick={e => e.stopPropagation()}>
                      {lead.documento_pdf_url
                        ? <a href={lead.documento_pdf_url} target="_blank" rel="noreferrer" className="btn-link" style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ExternalLink size={13} /> Ver</a>
                        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmtDate(lead.created_at)}</td>
                  </tr>
                ))}
                {!loading && filteredLeads.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    {searchQuery.trim() ? 'Sin resultados para esa búsqueda' : 'Sin leads registrados aún'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista Calendario */}
      {activeView === 'calendario' && (
        <CalendarioView leads={leads} onSchedule={handleSchedule} onOpenModal={setSelectedLead} addToast={addToast} />
      )}

      {/* Vista Pipeline */}
      {activeView === 'pipeline' && (
        <PipelineView leads={leads} onMoveColumn={handleMoveColumn} onOpenModal={setSelectedLead} />
      )}

      {/* Modal de edición de lead */}
      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onSaved={handleSaved} addToast={addToast} />
      )}
    </div>
  );
}

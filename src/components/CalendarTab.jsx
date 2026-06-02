import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink, Calendar, Table2, UserX, Gift, Send, MessageSquare, Edit3, Plus } from 'lucide-react';

const INACTIVE_DAYS = 25;

const monthNames = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const daysOfWeek = ['L','M','X','J','V','S','D'];


function StatusBadge({ status }) {
  if (status === 'completada')
    return <span className="badge badge-bot">Completada</span>;
  if (status === 'cancelada')
    return <span className="badge badge-manual">Cancelada</span>;
  if (status === 'confirmada')
    return <span className="badge" style={{ background: 'rgba(67,160,71,0.13)', color: '#2E7D32', border: '1px solid rgba(67,160,71,0.35)' }}>Confirmada</span>;
  return (
    <span className="badge" style={{ background: 'rgba(212,163,115,0.18)', color: '#8B6914', border: '1px solid rgba(212,163,115,0.4)' }}>
      Pendiente
    </span>
  );
}

function getDaysInMonth(month, year) {
  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const numDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
    const prevDate = prevMonthDays - i;
    days.push({ day: prevDate, isCurrentMonth: false, dateStr: `${year}-${String(month).padStart(2,'0')}-${String(prevDate).padStart(2,'0')}` });
  }
  for (let i = 1; i <= numDays; i++) {
    days.push({ day: i, isCurrentMonth: true, dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}` });
  }
  const totalCells = days.length <= 35 ? 35 : 42;
  for (let i = 1; i <= totalCells - days.length; i++) {
    days.push({ day: i, isCurrentMonth: false, dateStr: `${year}-${String(month + 2).padStart(2,'0')}-${String(i).padStart(2,'0')}` });
  }
  return days;
}

// ─── Discount Modal ───────────────────────────────────────────
function DiscountModal({ clients, singleClient, onClose, addToast }) {
  const [descuento, setDescuento] = useState('15');
  const [vencimiento, setVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const preview = (name) =>
    `Hola ${name}! 🥩 Te esperamos de vuelta en Criollo con un ${descuento}% OFF en tu próxima reserva. Válido hasta el ${vencimiento.split('-').reverse().join('/')}. ¡Reservá por este mismo chat!`;

  const handleSend = () => {
    addToast('WhatsApp aún no configurado. Configurá Evolution API en Integraciones para enviar mensajes.');
    onClose();
  };
  const handleSendAll = () => {
    addToast('WhatsApp aún no configurado. Configurá Evolution API en Integraciones para enviar mensajes.');
    onClose();
  };

  const displayClient = singleClient || (clients.length === 1 ? clients[0] : null);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={18} /> Plantilla de descuento
          </h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Descuento (%)</label>
              <input
                type="number" min="5" max="50" step="5"
                className="form-input"
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
                style={{ padding: '8px 10px', fontSize: 14 }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 11, marginBottom: 4, display: 'block' }}>Válido hasta</label>
              <input
                type="date"
                className="form-input"
                value={vencimiento}
                onChange={e => setVencimiento(e.target.value)}
                style={{ padding: '8px 10px', fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#25D166', fontWeight: 700, fontSize: 12 }}>
              <MessageSquare size={13} /> Vista previa WhatsApp
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
              {preview(displayClient?.name || (clients.length > 1 ? '{nombre}' : '...'))}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {displayClient ? (
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleSend(displayClient)}>
                <Send size={14} /> Enviar a {displayClient.name}
              </button>
            ) : null}
            {clients.length > 1 && (
              <button
                className="btn-primary"
                style={{ flex: 1, background: 'var(--accent-olive)', borderColor: 'var(--accent-olive)' }}
                onClick={handleSendAll}
              >
                <Send size={14} /> Enviar a todos ({clients.length})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reserva Form Modal ────────────────────────────────────────
function ReservaFormModal({ mode, apt, prefillDate, onSave, onClose, addToast }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    nombre:         apt?.name           || '',
    telefono:       apt?.phone          || '',
    fecha:          apt?.date           || prefillDate || today,
    hora:           apt?.time           || '20:00',
    personas:       String(apt?.guests  || 2),
    salon_exterior: apt?.salon_exterior  || 'Salón',
    estado:         apt?.status         || 'pendiente',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim())           { addToast('⚠️ El nombre es obligatorio'); return; }
    if (!form.fecha)                   { addToast('⚠️ La fecha es obligatoria');  return; }
    if (!form.hora)                    { addToast('⚠️ La hora es obligatoria');   return; }
    if (!form.personas || Number(form.personas) < 1) { addToast('⚠️ Ingresá el número de personas'); return; }
    onSave({ ...form, personas: Number(form.personas) });
    onClose();
  };

  const lbl = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: 5, display: 'block' };
  const inp = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--border-color)', borderRadius: 8, background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, borderRadius: 20 }}>
        <div className="modal-header">
          <h3 className="modal-title">{mode === 'edit' ? 'Editar Reserva' : 'Nueva Reserva'}</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Nombre del cliente *</label>
              <input style={inp} placeholder="Nombre y apellido" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Teléfono</label>
              <input style={inp} type="tel" placeholder="+54 9 351..." value={form.telefono} onChange={e => set('telefono', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Fecha *</label>
              <input style={inp} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Hora *</label>
              <input style={inp} type="time" value={form.hora} onChange={e => set('hora', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Personas *</label>
              <input style={inp} type="number" min="1" max="50" value={form.personas} onChange={e => set('personas', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Ubicación</label>
              <select style={inp} value={form.salon_exterior} onChange={e => set('salon_exterior', e.target.value)}>
                <option value="Salón">Salón</option>
                <option value="Exterior">Exterior</option>
              </select>
            </div>
            {mode === 'edit' && (
              <div>
                <label style={lbl}>Estado</label>
                <select style={inp} value={form.estado} onChange={e => set('estado', e.target.value)}>
                  <option value="confirmada">Confirmada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {mode === 'edit' ? 'Guardar Cambios' : 'Crear Reserva'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Calendario View ──────────────────────────────────────────
function CalendarioView({ appointments, currentMonth, currentYear, setCurrentMonth, setCurrentYear, onSelectApt, onMoveAppointment, addToast, onOpenForm }) {
  const [dragOverDate, setDragOverDate] = useState(null);
  const [hoverCell,    setHoverCell]    = useState(null);

  const calendarDays = getDaysInMonth(currentMonth, currentYear);
  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="calendar-header">
        <div className="calendar-title-wrapper">
          <span className="calendar-month-title">{monthNames[currentMonth]}</span>
          <span className="calendar-year-title">{currentYear}</span>
        </div>
        <div className="calendar-controls">
          <button
            className="btn-today"
            onClick={() => addToast('Google Calendar aún no está configurado. Próximamente disponible.')}
            style={{ marginRight: 8, backgroundColor: 'var(--accent-olive)', color: 'white', borderColor: 'var(--accent-olive)' }}
          >
            Sincronizar Google Calendar
          </button>
          <button className="btn-today" onClick={() => { const d = new Date(); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }}>
            Hoy
          </button>
          <button className="btn-icon-nav" onClick={() => {
            if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
            else setCurrentMonth(m => m - 1);
          }}><ChevronLeft size={16} /></button>
          <button className="btn-icon-nav" onClick={() => {
            if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
            else setCurrentMonth(m => m + 1);
          }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map((d, i) => <div key={i} className="calendar-day-label">{d}</div>)}
        {calendarDays.map((cell, idx) => {
          const dateApts = appointments.filter(a => a.date === cell.dateStr);
          const isToday = today === cell.dateStr;
          const isDragOver = dragOverDate === cell.dateStr;

          return (
            <div
              key={idx}
              className={`calendar-cell ${cell.isCurrentMonth ? '' : 'outside-month'} ${isToday ? 'today' : ''}`}
              style={{
                position: 'relative',
                ...(isDragOver ? { outline: '2px dashed var(--accent-gold)', background: 'rgba(212,163,115,0.08)' } : {}),
              }}
              onMouseEnter={() => cell.isCurrentMonth && setHoverCell(cell.dateStr)}
              onMouseLeave={() => setHoverCell(null)}
              onDragOver={e => { e.preventDefault(); setDragOverDate(cell.dateStr); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={e => {
                e.preventDefault();
                setDragOverDate(null);
                const aptId = e.dataTransfer.getData('aptId');
                if (aptId && cell.isCurrentMonth) {
                  onMoveAppointment(aptId, cell.dateStr);
                  addToast(`Reserva movida al ${cell.dateStr.split('-').reverse().join('/')}`);
                }
              }}
            >
              <span className="cell-number">{cell.day}</span>
              <div className="cell-appointments">
                {dateApts.map(apt => (
                  <button
                    key={apt.id}
                    className="apt-tag"
                    draggable
                    onDragStart={e => { e.dataTransfer.setData('aptId', apt.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onClick={() => onSelectApt(apt)}
                    style={{ cursor: 'grab' }}
                  >
                    {apt.time} {apt.name}
                  </button>
                ))}
              </div>
              {cell.isCurrentMonth && (
                <button
                  title="Nueva reserva"
                  onClick={e => { e.stopPropagation(); onOpenForm({ mode: 'add', prefillDate: cell.dateStr }); }}
                  style={{
                    position: 'absolute', bottom: 5, right: 5,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--accent-terracotta)', color: '#fff',
                    border: 'none', cursor: 'pointer',
                    fontSize: 16, fontWeight: 700, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: hoverCell === cell.dateStr ? 1 : 0,
                    transition: 'opacity 0.15s',
                    zIndex: 2,
                  }}
                >+</button>
              )}
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item"><span className="legend-color legend-completed"></span><span>Completada / Confirmada</span></div>
        <div className="legend-item"><span className="legend-color legend-cancelled"></span><span>Cancelada</span></div>
        <div className="legend-item" style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>Arrastrá una reserva para cambiarla de día</div>
      </div>
    </>
  );
}

// ─── Tabla View ───────────────────────────────────────────────
function TablaView({ appointments, onSelectApt, onOpenForm }) {
  const today = new Date().toISOString().split('T')[0];
  const sorted = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.time || '').localeCompare(a.time || '');
  });

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          className="btn-primary"
          onClick={() => onOpenForm({ mode: 'add', prefillDate: today })}
          style={{ fontSize: 13, padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={14} /> Nueva Reserva
        </button>
      </div>
      <div className="data-table-wrapper">
      {sorted.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay reservas registradas</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Personas</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(apt => (
              <tr key={apt.id}>
                <td style={{ fontWeight: 600 }}>{apt.date.split('-').reverse().join('/')}</td>
                <td style={{ color: 'var(--accent-terracotta)', fontWeight: 600 }}>{apt.time}</td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell-avatar">{(apt.name || '?').charAt(0)}</div>
                    <span style={{ fontWeight: 600 }}>{apt.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{apt.phone}</td>
                <td>{apt.guests}</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: apt.salon_exterior === 'Exterior' ? 'rgba(46,125,50,0.12)' : 'rgba(79,109,122,0.12)',
                    color: apt.salon_exterior === 'Exterior' ? '#2E7D32' : '#3E5661',
                  }}>
                    {apt.salon_exterior || 'Salón'}
                  </span>
                </td>
                <td><StatusBadge status={apt.status} /></td>
                <td>
                  <button className="btn-link" style={{ fontSize: 13 }} onClick={() => onSelectApt(apt)}>Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
}

// ─── Inactivos View ───────────────────────────────────────────
function InactivosView({ appointments, addToast }) {
  const [discountModal, setDiscountModal] = useState(null);

  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
  const byKey = {};
  appointments.forEach(a => {
    const key = a.phone || a.name;
    const d = new Date(a.date);
    if (!byKey[key] || d > new Date(byKey[key].lastDate)) {
      byKey[key] = { name: a.name, phone: a.phone || '—', lastDate: a.date };
    }
  });
  const inactive = Object.values(byKey)
    .filter(p => new Date(p.lastDate) < cutoff)
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate));

  const calcDaysAgo = dateStr => Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
  const displayRows = inactive.length > 0 ? inactive : null;

  const renderRow = (p, isDemo, i) => {
    const days = isDemo ? p.daysAgo : calcDaysAgo(p.lastDate);
    return (
      <tr key={i}>
        <td>
          <div className="user-cell">
            <div className="user-cell-avatar">{p.name.charAt(0)}</div>
            <span style={{ fontWeight: 600 }}>{p.name}</span>
          </div>
        </td>
        <td style={{ color: 'var(--text-secondary)' }}>{p.phone}</td>
        <td>{p.lastDate.split('-').reverse().join('/')}</td>
        <td>
          <span style={{ fontWeight: 700, color: days > 60 ? 'var(--accent-terracotta)' : 'var(--text-primary)' }}>
            {days} días
          </span>
        </td>
        <td>
          <button
            className="btn-primary"
            style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => setDiscountModal({ client: p, all: false })}
          >
            <Gift size={12} /> Descuento
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
          {inactive.length > 0
            ? `${inactive.length} cliente${inactive.length !== 1 ? 's' : ''} sin reservar en los últimos ${INACTIVE_DAYS} días.`
            : `No hay clientes inactivos por más de ${INACTIVE_DAYS} días en tu base de datos.`}
        </p>
        {inactive.length > 1 && (
          <button
            className="btn-primary"
            style={{ fontSize: 13, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            onClick={() => setDiscountModal({ client: null, all: true })}
          >
            <Send size={13} /> Enviar a todos ({inactive.length})
          </button>
        )}
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Última reserva</th>
              <th>Días sin volver</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {displayRows
              ? displayRows.map((p, i) => renderRow(p, false, i))
              : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Sin clientes inactivos — todos han reservado en los últimos {INACTIVE_DAYS} días
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>

      {discountModal && (
        <DiscountModal
          clients={discountModal.all ? inactive : (discountModal.client ? [discountModal.client] : inactive)}
          singleClient={discountModal.all ? null : discountModal.client}
          onClose={() => setDiscountModal(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CalendarTab({ appointments, onSelectConversation, onMoveAppointment, onAddAppointment, onUpdateAppointment, addToast }) {
  const [activeView,   setActiveView]   = useState('calendario');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear,  setCurrentYear]  = useState(2026);
  const [selectedApt,  setSelectedApt]  = useState(null);
  const [formModal,    setFormModal]    = useState(null);

  const handleFormSave = (data) => {
    if (formModal.mode === 'edit') onUpdateAppointment(formModal.apt.id, data);
    else                           onAddAppointment(data);
    setFormModal(null);
  };

  const views = [
    { id: 'calendario', label: 'Calendario', icon: <Calendar size={14} /> },
    { id: 'tabla',      label: 'Tabla',       icon: <Table2 size={14} /> },
    { id: 'inactivos',  label: 'Inactivos',   icon: <UserX size={14} /> },
  ];

  const baseBtn = { borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
  const activeBtn   = { ...baseBtn, background: 'var(--accent-olive)', color: '#fff', border: '1px solid var(--accent-olive)', fontWeight: 600 };
  const inactiveBtn = { ...baseBtn, background: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 500 };

  return (
    <div className="calendar-view-wrapper">
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {views.map(v => (
          <button key={v.id} style={activeView === v.id ? activeBtn : inactiveBtn} onClick={() => setActiveView(v.id)}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {activeView === 'calendario' && (
        <CalendarioView
          appointments={appointments}
          currentMonth={currentMonth}
          currentYear={currentYear}
          setCurrentMonth={setCurrentMonth}
          setCurrentYear={setCurrentYear}
          onSelectApt={setSelectedApt}
          onMoveAppointment={onMoveAppointment}
          onOpenForm={setFormModal}
          addToast={addToast}
        />
      )}
      {activeView === 'tabla' && <TablaView appointments={appointments} onSelectApt={setSelectedApt} onOpenForm={setFormModal} />}
      {activeView === 'inactivos'  && <InactivosView appointments={appointments} addToast={addToast} />}

      {/* Appointment detail modal */}
      {selectedApt && (
        <div className="modal-overlay" onClick={() => setSelectedApt(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles de Reserva</h3>
              <button className="btn-close" onClick={() => setSelectedApt(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-row"><span className="detail-label">Cliente</span><span className="detail-value">{selectedApt.name}</span></div>
              <div className="detail-row"><span className="detail-label">Teléfono</span><span className="detail-value">{selectedApt.phone}</span></div>
              <div className="detail-row">
                <span className="detail-label">Fecha y Hora</span>
                <span className="detail-value">{selectedApt.date.split('-').reverse().join('/')} — {selectedApt.time} hs</span>
              </div>
              <div className="detail-row"><span className="detail-label">Comensales</span><span className="detail-value">{selectedApt.guests} personas</span></div>
              <div className="detail-row">
                <span className="detail-label">Ubicación</span>
                <span className="detail-value" style={{
                  color: selectedApt.salon_exterior === 'Exterior' ? '#2E7D32' : 'var(--accent-olive)',
                  fontWeight: 600,
                }}>
                  {selectedApt.salon_exterior || 'Salón'}
                </span>
              </div>
              <div className="detail-row"><span className="detail-label">Estado</span><span className="detail-value"><StatusBadge status={selectedApt.status} /></span></div>
              {/* Fila de acciones */}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (selectedApt.name === 'Agustín') onSelectConversation('conv_1');
                    else if (selectedApt.name === 'María') onSelectConversation('conv_2');
                    else if (selectedApt.name.includes('Carlos')) onSelectConversation('conv_3');
                    setSelectedApt(null);
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Supervisar Chat <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => { setFormModal({ mode: 'edit', apt: selectedApt }); setSelectedApt(null); }}
                  style={{ flex: 1, background: 'var(--accent-olive)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}
                >
                  <Edit3 size={14} /> Editar
                </button>
              </div>
              <button
                onClick={async () => { await onUpdateAppointment(selectedApt.id, { estado: 'cancelada' }); setSelectedApt(null); }}
                style={{ width: '100%', marginTop: 8, background: 'none', border: '1px solid var(--status-paused-text)', color: 'var(--status-paused-text)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal: crear o editar reserva */}
      {formModal && (
        <ReservaFormModal
          mode={formModal.mode}
          apt={formModal.apt || null}
          prefillDate={formModal.prefillDate || null}
          onSave={handleFormSave}
          onClose={() => setFormModal(null)}
          addToast={addToast}
        />
      )}
    </div>
  );
}

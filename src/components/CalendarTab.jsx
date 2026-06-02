import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink, Calendar, Table2, UserX, Gift } from 'lucide-react';

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
    days.push({
      day: prevDate,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month).padStart(2,'0')}-${String(prevDate).padStart(2,'0')}`,
    });
  }
  for (let i = 1; i <= numDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`,
    });
  }
  const totalCells = days.length <= 35 ? 35 : 42;
  for (let i = 1; i <= totalCells - days.length; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      dateStr: `${year}-${String(month + 2).padStart(2,'0')}-${String(i).padStart(2,'0')}`,
    });
  }
  return days;
}

// ─── Calendario View ──────────────────────────────────────────
function CalendarioView({ appointments, currentMonth, currentYear, setCurrentMonth, setCurrentYear, onSelectApt, onMoveAppointment, addToast }) {
  const [dragOverDate, setDragOverDate] = useState(null);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

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
            onClick={() => addToast('Sincronizando con Google Calendar API...')}
            style={{ marginRight: 8, backgroundColor: 'var(--accent-olive)', color: 'white', borderColor: 'var(--accent-olive)' }}
          >
            Sincronizar Google Calendar
          </button>
          <button className="btn-today" onClick={() => { const d = new Date(); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); }}>Hoy</button>
          <button className="btn-icon-nav" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
          <button className="btn-icon-nav" onClick={handleNextMonth}><ChevronRight size={16} /></button>
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
              style={isDragOver ? { outline: '2px dashed var(--accent-gold)', background: 'rgba(212,163,115,0.08)' } : undefined}
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
function TablaView({ appointments, onSelectApt }) {
  const sorted = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.time || '').localeCompare(a.time || '');
  });

  return (
    <div className="data-table-wrapper" style={{ marginTop: 8 }}>
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
  );
}

// ─── Inactivos View ───────────────────────────────────────────
function InactivosView({ appointments, addToast }) {
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

  const daysAgo = dateStr => Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));

  if (inactive.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <UserX size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <p>No hay clientes inactivos por más de {INACTIVE_DAYS} días.</p>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '8px 0 16px' }}>
        {inactive.length} cliente{inactive.length !== 1 ? 's' : ''} sin reservar en los últimos {INACTIVE_DAYS} días.
      </p>
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
            {inactive.map((p, i) => (
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
                  <span style={{ fontWeight: 700, color: daysAgo(p.lastDate) > 60 ? 'var(--accent-terracotta)' : 'var(--text-primary)' }}>
                    {daysAgo(p.lastDate)} días
                  </span>
                </td>
                <td>
                  <button
                    className="btn-link"
                    style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => addToast(`Descuento enviado a ${p.name} — ${p.phone}`)}
                  >
                    <Gift size={13} /> Enviar descuento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CalendarTab({ appointments, onSelectConversation, onMoveAppointment, addToast }) {
  const [activeView, setActiveView] = useState('calendario');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedApt, setSelectedApt] = useState(null);

  const views = [
    { id: 'calendario', label: 'Calendario', icon: <Calendar size={14} /> },
    { id: 'tabla',      label: 'Tabla',       icon: <Table2 size={14} /> },
    { id: 'inactivos',  label: 'Inactivos',   icon: <UserX size={14} /> },
  ];

  const baseBtn = {
    borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  };
  const activeBtn  = { ...baseBtn, background: 'var(--accent-olive)', color: '#fff', border: '1px solid var(--accent-olive)' };
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
          addToast={addToast}
        />
      )}
      {activeView === 'tabla' && <TablaView appointments={appointments} onSelectApt={setSelectedApt} />}
      {activeView === 'inactivos' && <InactivosView appointments={appointments} addToast={addToast} />}

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
              <div className="detail-row"><span className="detail-label">Estado</span><span className="detail-value"><StatusBadge status={selectedApt.status} /></span></div>
              <button
                className="btn-primary"
                onClick={() => {
                  if (selectedApt.name === 'Agustín') onSelectConversation('conv_1');
                  else if (selectedApt.name === 'María') onSelectConversation('conv_2');
                  else if (selectedApt.name.includes('Carlos')) onSelectConversation('conv_3');
                  setSelectedApt(null);
                }}
                style={{ marginTop: 16, display: 'flex', justifyContent: 'center', width: '100%' }}
              >
                Supervisar Chat <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

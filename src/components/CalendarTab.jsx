import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Plus, ExternalLink } from 'lucide-react';

export default function CalendarTab({ appointments, onSelectConversation, addToast }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedApt, setSelectedApt] = useState(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Generate calendar days for current month/year
  const getDaysInMonth = (month, year) => {
    // Month is 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1, etc.
    // Convert to European style (Monday=0, Sunday=6)
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const numDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Fill offset days from prev month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const prevDate = prevMonthDays - i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(prevDate).padStart(2, '0')}`;
      days.push({ day: prevDate, isCurrentMonth: false, dateStr });
    }

    // Fill current month days
    for (let i = 1; i <= numDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, isCurrentMonth: true, dateStr });
    }

    // Fill offset days from next month (to reach grid size 35 or 42)
    const totalCells = days.length <= 35 ? 35 : 42;
    const nextDaysCount = totalCells - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, isCurrentMonth: false, dateStr });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    addToast('Mostrando mes actual');
  };

  const handleSyncCalendar = () => {
    addToast('Sincronizando con Google Calendar API...');
    setTimeout(() => {
      addToast('✓ Google Calendar sincronizado correctamente.');
    }, 1500);
  };

  const calendarDays = getDaysInMonth(currentMonth, currentYear);

  return (
    <div className="calendar-view-wrapper">
      <div className="calendar-header">
        <div className="calendar-title-wrapper">
          <span className="calendar-month-title">{monthNames[currentMonth]}</span>
          <span className="calendar-year-title">{currentYear}</span>
        </div>

        <div className="calendar-controls">
          <button className="btn-today" onClick={handleSyncCalendar} style={{ marginRight: '8px', backgroundColor: 'var(--accent-olive)', color: 'white', borderColor: 'var(--accent-olive)' }}>
            Sincronizar Google Calendar
          </button>
          <button className="btn-today" onClick={handleGoToToday}>Hoy</button>
          <button className="btn-icon-nav" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
          <button className="btn-icon-nav" onClick={handleNextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map((day, i) => (
          <div key={i} className="calendar-day-label">{day}</div>
        ))}

        {calendarDays.map((cell, idx) => {
          // Find appointments on this date
          const dateApts = appointments.filter(apt => apt.date === cell.dateStr);
          const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;

          return (
            <div 
              key={idx} 
              className={`calendar-cell ${cell.isCurrentMonth ? '' : 'outside-month'} ${isToday ? 'today' : ''}`}
            >
              <span className="cell-number">{cell.day}</span>
              <div className="cell-appointments">
                {dateApts.map(apt => (
                  <button 
                    key={apt.id} 
                    className="apt-tag" 
                    onClick={() => setSelectedApt(apt)}
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
        <div className="legend-item">
          <span className="legend-color legend-completed"></span>
          <span>Completada / Confirmada</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-cancelled"></span>
          <span>Cancelada</span>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedApt && (
        <div className="modal-overlay" onClick={() => setSelectedApt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles de Reserva</h3>
              <button className="btn-close" onClick={() => setSelectedApt(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Cliente</span>
                <span className="detail-value">{selectedApt.name}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Teléfono</span>
                <span className="detail-value">{selectedApt.phone}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Fecha y Hora</span>
                <span className="detail-value">
                  {selectedApt.date.split('-').reverse().join('/')} - {selectedApt.time} hs
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Mesa / Comensales</span>
                <span className="detail-value">{selectedApt.guests} personas</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Estado</span>
                <span className="detail-value" style={{ textTransform: 'capitalize', color: 'var(--status-active-text)' }}>
                  {selectedApt.status}
                </span>
              </div>

              <button 
                className="btn-primary" 
                onClick={() => {
                  // Find matching conversation
                  const matchingConv = appointments.find(a => a.id === selectedApt.id);
                  // We simulate navigation to Agustín or matching chat
                  if (selectedApt.name === 'Agustín') {
                    onSelectConversation('conv_1');
                  } else if (selectedApt.name === 'María') {
                    onSelectConversation('conv_2');
                  } else if (selectedApt.name.includes('Carlos')) {
                    onSelectConversation('conv_3');
                  }
                  setSelectedApt(null);
                }}
                style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', width: '100%' }}
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

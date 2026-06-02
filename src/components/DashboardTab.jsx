import React from 'react';
import { Calendar, Zap, Users, AlertTriangle, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';

const MAX_CAPACITY = 60;

export default function DashboardTab({ conversations, appointments, onNavigateToTab, onSelectConversation }) {
  const today = new Date().toISOString().split('T')[0];

  // KPI calculations
  const todayReservas  = appointments.filter(a => a.date === today && a.status !== 'cancelada');
  const cubiertosHoy   = todayReservas.reduce((sum, a) => sum + (a.guests || 0), 0);
  const ocupacionPct   = Math.min(100, Math.round((cubiertosHoy / MAX_CAPACITY) * 100));
  const botActiveCount = conversations.filter(c => c.botActive).length;
  const automationRate = conversations.length > 0 ? Math.round((botActiveCount / conversations.length) * 100) : 0;
  const urgentChats    = conversations.filter(c => !c.botActive);

  // Last 7 days bar chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return {
      iso,
      label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
      count: appointments.filter(a => a.date === iso).length,
      isToday: iso === today,
    };
  });
  const maxCount = Math.max(...last7.map(d => d.count), 1);

  // Today's reservas sorted by time
  const todaySorted = [...todayReservas].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const statusLabel = (s) => {
    if (s === 'completada') return <span className="badge badge-bot">Completada</span>;
    if (s === 'cancelada')  return <span className="badge badge-manual">Cancelada</span>;
    return <span className="badge" style={{ background: 'rgba(212,163,115,0.18)', color: '#8B6914', border: '1px solid rgba(212,163,115,0.4)' }}>Pendiente</span>;
  };

  return (
    <div className="dashboard-view">

      {/* KPI Cards */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Tasa de Automatización</span>
            <div className="stat-icon-wrapper"><Zap size={18} /></div>
          </div>
          <span className="stat-value">{automationRate}%</span>
          <span className="stat-desc">Reservas cerradas sin intervención humana</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Cubiertos para Hoy</span>
            <div className="stat-icon-wrapper"><Users size={18} /></div>
          </div>
          <span className="stat-value">{cubiertosHoy}</span>
          <span className="stat-desc">Repartidos en {todayReservas.length} reserva{todayReservas.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Ocupación Esta Noche</span>
            <div className="stat-icon-wrapper"><TrendingUp size={18} /></div>
          </div>
          <span className="stat-value">{ocupacionPct}%</span>
          <span className="stat-desc">{MAX_CAPACITY - cubiertosHoy} lugares disponibles</span>
        </div>

        <div className={`stat-card ${urgentChats.length > 0 ? 'alert-card' : ''}`}>
          <div className="stat-header">
            <span className="stat-title">Atención Urgente</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={18} /></div>
          </div>
          <span className="stat-value">{urgentChats.length}</span>
          <span className="stat-desc">Chats esperando a un humano</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <h3 className="section-title">Reservas — últimos 7 días</h3>
          <button className="btn-link" onClick={() => onNavigateToTab('reservas')}>
            Ver calendario <ArrowRight size={16} />
          </button>
        </div>
        <div className="chart-outer">
          {last7.map(day => (
            <div key={day.iso} className="chart-bar-col">
              <span className="chart-count">{day.count > 0 ? day.count : ''}</span>
              <div
                className="chart-bar"
                style={{
                  height: `${Math.max(4, (day.count / maxCount) * 100)}%`,
                  background: day.isToday ? 'var(--accent-terracotta)' : 'var(--accent-gold)',
                  opacity: day.count === 0 ? 0.25 : 1,
                }}
              />
              <span className="chart-label" style={{ fontWeight: day.isToday ? 700 : 400 }}>{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom two-column grid */}
      <div className="dashboard-bottom-grid">

        {/* Left: Today's reservas */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Próximos a llegar hoy</h3>
            <button className="btn-link" onClick={() => onNavigateToTab('reservas')}>
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          {todaySorted.length === 0 ? (
            <div className="empty-state-inline">
              <Calendar size={28} style={{ color: 'var(--text-tertiary)' }} />
              <span>No hay reservas para hoy</span>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Nombre</th>
                    <th>Personas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySorted.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-terracotta)' }}>{a.time}</td>
                      <td>
                        <div className="user-cell">
                          <div className="user-cell-avatar">{(a.name || '?').charAt(0)}</div>
                          <span style={{ fontWeight: 600 }}>{a.name}</span>
                        </div>
                      </td>
                      <td>{a.guests}</td>
                      <td>{statusLabel(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Chats needing attention */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">Chats por intervenir</h3>
            <button className="btn-link" onClick={() => onNavigateToTab('conversaciones')}>
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          {urgentChats.length === 0 ? (
            <div className="empty-state-inline">
              <CheckCircle size={28} style={{ color: 'var(--accent-olive)' }} />
              <span style={{ color: 'var(--accent-olive)' }}>Todo en orden — el bot está activo</span>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Último mensaje</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {urgentChats.map(conv => (
                    <tr key={conv.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-cell-avatar">{conv.name.charAt(0)}</div>
                          <span style={{ fontWeight: 600 }}>{conv.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.lastMessage}
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => onSelectConversation(conv.id)}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-terracotta)' }}
                        >
                          Intervenir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

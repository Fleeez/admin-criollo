import React from 'react';
import { MessageSquare, Calendar, ToggleLeft, ArrowRight, User } from 'lucide-react';

export default function DashboardTab({ conversations, appointments, onNavigateToTab, onSelectConversation }) {
  // Compute some quick metrics
  const totalConversations30d = conversations.length + 12; // simulated past conversations
  const appointmentsThisWeek = appointments.length + 3; // simulated past appointments
  const appointmentsToday = appointments.filter(a => a.date === '2026-06-01' || a.date === new Date().toISOString().split('T')[0]).length;
  const botPausedCount = conversations.filter(c => !c.botActive).length;

  return (
    <div className="dashboard-view">
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Conversaciones 30D</span>
            <div className="stat-icon-wrapper">
              <MessageSquare size={18} />
            </div>
          </div>
          <span className="stat-value">{totalConversations30d}</span>
          <span className="stat-desc">Últimos 30 días</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Citas esta semana</span>
            <div className="stat-icon-wrapper">
              <Calendar size={18} />
            </div>
          </div>
          <span className="stat-value">{appointmentsThisWeek}</span>
          <span className="stat-desc">Lunes a domingo</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Citas hoy</span>
            <div className="stat-icon-wrapper">
              <Calendar size={18} />
            </div>
          </div>
          <span className="stat-value">{appointmentsToday}</span>
          <span className="stat-desc">Hoy</span>
        </div>

        <div className="stat-card alert-card">
          <div className="stat-header">
            <span className="stat-title">Bot en pausa</span>
            <div className="stat-icon-wrapper">
              <ToggleLeft size={18} />
            </div>
          </div>
          <span className="stat-value">{botPausedCount}</span>
          <span className="stat-desc">Conversaciones con atención humana</span>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h3 className="section-title">Últimas conversaciones</h3>
          <button className="btn-link" onClick={() => onNavigateToTab('conversaciones')}>
            Ver todas <ArrowRight size={16} />
          </button>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Último mensaje</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map(conv => (
                <tr key={conv.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">
                        {conv.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{conv.name}</span>
                    </div>
                  </td>
                  <td>{conv.phone}</td>
                  <td>
                    <span className={`badge ${conv.botActive ? 'badge-bot' : 'badge-manual'}`}>
                      {conv.botActive ? 'Bot Activo' : 'Manual'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.lastMessage}
                  </td>
                  <td>
                    <button 
                      className="btn-link" 
                      onClick={() => onSelectConversation(conv.id)}
                      style={{ fontSize: '13px', fontWeight: '600' }}
                    >
                      Intervenir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

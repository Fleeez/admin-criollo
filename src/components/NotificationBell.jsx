import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, Calendar, Users } from 'lucide-react';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min  = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  if (min < 2)  return 'ahora';
  if (min < 60) return `${min} min`;
  if (hrs < 24) return `${hrs}h`;
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

const TYPE_ICONS = {
  message:  MessageSquare,
  reserva:  Calendar,
  inversor: Users,
};

const TYPE_LABELS = {
  message:  'Mensaje',
  reserva:  'Reserva',
  inversor: 'Inversor',
};

export default function NotificationBell({ notifications, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      <button
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        title="Notificaciones"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Novedades</span>
            {unreadCount > 0 && (
              <button className="notif-mark-read" onClick={() => { onMarkAllRead(); }}>
                Marcar todo leído
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={24} />
              <p>Sin novedades aún</p>
            </div>
          ) : (
            <ul className="notif-list">
              {notifications.slice(0, 15).map(n => {
                const Icon = TYPE_ICONS[n.type] || Bell;
                return (
                  <li key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                    <div className={`notif-item-icon notif-icon-${n.type}`}>
                      <Icon size={13} />
                    </div>
                    <div className="notif-item-body">
                      <span className="notif-item-label">{TYPE_LABELS[n.type] || n.type}</span>
                      <span className="notif-item-title">{n.title}</span>
                      {n.body && <span className="notif-item-text">{n.body}</span>}
                    </div>
                    <span className="notif-item-time">{timeAgo(n.time)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, MessageSquare, Calendar, Settings, AlertCircle, LogOut, Users, Moon, Sun, Bot } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import DashboardTab from './components/DashboardTab';
import ConversationsTab from './components/ConversationsTab';
import CalendarTab from './components/CalendarTab';
import IntegrationsTab from './components/IntegrationsTab';
import InversoresTab from './components/InversoresTab';
import ChatDrawer from './components/ChatDrawer';
import ConfiguracionBotTab from './components/ConfiguracionBotTab';
import ErrorBoundary from './components/ErrorBoundary';

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapReserva(r) {
  const e = (r.estado ?? '').toLowerCase();
  const status = (e === 'cancelada' || e === 'cancelled' || e === 'canceled')
    ? 'cancelada'
    : (e === 'completada' || e === 'completed') ? 'completada'
    : (e === 'confirmada') ? 'confirmada'
    : 'pendiente';
  return {
    id: String(r.id),
    name: r.nombre,
    phone: r.telefono,
    date: r.fecha,
    time: r.hora,
    guests: r.personas,
    status,
    salon_exterior: r.salon_exterior || 'Salón',
  };
}

function formatRelative(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const min  = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (min < 2)   return 'ahora';
  if (min < 60)  return `${min} min`;
  if (hrs < 24)  return `${hrs} hora${hrs > 1 ? 's' : ''}`;
  return `${days} día${days > 1 ? 's' : ''}`;
}

function mapConversation(row) {
  return {
    id:          row.id,
    name:        row.name  || row.phone,
    phone:       row.phone,
    botActive:   row.bot_active !== false,
    lastMessage: row.last_message || '',
    timestamp:   formatRelative(row.updated_at),
    messages:    [],
  };
}

function mapMensaje(m) {
  const senderMap = { whatsapp: 'client', bot: 'ai', humano: 'human' };
  return {
    id:     m.id,
    sender: senderMap[m.origen] || 'client',
    text:   m.mensaje,
    time:   new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    date:   new Date(m.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App({ session }) {
  const [activeTab, setActiveTab]       = useState('dashboard');
  const [conversations, setConversations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [toasts, setToasts]             = useState([]);
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem('criollo_dark') === '1');
  const [drawerConvId, setDrawerConvId] = useState(null);
  const [now, setNow]                   = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('criollo_dark', next ? '1' : '0');
      return next;
    });
  };

  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  // ── Cargar datos desde Supabase ───────────────────────────────────────────────
  useEffect(() => {
    // Conversations
    supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error('[Panel] Error cargando conversaciones:', error); return; }
        const mapped = (data || []).map(mapConversation);
        setConversations(mapped);
        if (mapped.length > 0 && !selectedConvId) setSelectedConvId(mapped[0].id);
      });

    // Reservas
    supabase
      .from('reservas')
      .select('*')
      .order('fecha_iso', { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) { console.error('[Panel] Error cargando reservas:', error); return; }
        setAppointments((rows || []).map(mapReserva));
      });

    // ── Realtime: conversations list ──────────────────────────────────────────
    const convChannel = supabase
      .channel('conversations-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setConversations(prev => [mapConversation(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setConversations(prev => prev.map(c =>
            c.id === payload.new.id
              ? { ...c, name: payload.new.name || c.name, botActive: payload.new.bot_active !== false, lastMessage: payload.new.last_message || c.lastMessage, timestamp: formatRelative(payload.new.updated_at) }
              : c
          ));
        }
      })
      .subscribe();

    // ── Realtime: new messages ────────────────────────────────────────────────
    const msgChannel = supabase
      .channel('mensajes-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload) => {
        const msg = payload.new;
        setConversations(prev => prev.map(c => {
          if (c.phone !== msg.telefono) return c;
          return {
            ...c,
            messages:    [...(c.messages || []), mapMensaje(msg)],
            lastMessage: msg.mensaje,
            timestamp:   'ahora',
          };
        }));
      })
      .subscribe();

    // ── Realtime: reservas ────────────────────────────────────────────────────
    const resChannel = supabase
      .channel('reservas-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        supabase.from('reservas').select('*').order('fecha_iso', { ascending: true })
          .then(({ data: rows }) => setAppointments((rows || []).map(mapReserva)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(resChannel);
    };
  }, []);

  // ── Seleccionar conversación: carga mensajes lazy ─────────────────────────────
  const handleSelectConversation = async (convId) => {
    setSelectedConvId(convId);
    setActiveTab('conversaciones');

    const conv = conversations.find(c => c.id === convId);
    if (!conv || conv.messages.length > 0) return; // ya cargados

    const { data, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('telefono', conv.phone)
      .order('created_at', { ascending: true });

    if (error) { console.error('[Panel] Error cargando mensajes:', error); return; }
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, messages: (data || []).map(mapMensaje) } : c
    ));
  };

  // ── Toggle Bruno activo ───────────────────────────────────────────────────────
  const handleToggleBot = async (convId) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;
    const nextState = !conv.botActive;

    // Optimistic update
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, botActive: nextState } : c));
    addToast(nextState ? '✓ Bruno reactivado para esta conversación' : '⏸ Bruno pausado (atención humana activa)');

    const { error } = await supabase
      .from('conversations')
      .update({ bot_active: nextState })
      .eq('id', convId);

    if (error) {
      // Revert on error
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, botActive: !nextState } : c));
      addToast('⚠️ Error al cambiar estado del bot');
    }
  };

  // ── Enviar mensaje como humano ────────────────────────────────────────────────
  const handleSendMessage = async (convId, text) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv || !text.trim()) return;

    const wasBotActive = conv.botActive;

    if (wasBotActive) addToast('Intervención humana: Bruno pausado automáticamente');

    // Insert en Supabase → el bot lo recibe via Realtime y lo envía por WhatsApp
    const { error: msgErr } = await supabase.from('mensajes').insert({
      telefono: conv.phone,
      mensaje:  text,
      origen:   'humano',
      leido:    false,
    });
    if (msgErr) addToast('⚠️ Error al enviar mensaje: ' + msgErr.message);

    // Pausar bot en Supabase si estaba activo
    if (wasBotActive) {
      await supabase.from('conversations').update({ bot_active: false }).eq('id', convId);
    }
  };

  // ── Reservas ──────────────────────────────────────────────────────────────────
  const handleAddAppointment = async (data) => {
    const fechaIso = `${data.fecha}T${data.hora}:00`;
    const { error } = await supabase.from('reservas').insert({
      nombre: data.nombre, telefono: data.telefono || null,
      fecha: data.fecha, hora: data.hora, personas: Number(data.personas),
      salon_exterior: data.salon_exterior || 'Salón',
      estado: data.estado || 'pendiente', fecha_iso: fechaIso,
    });
    if (error) addToast('⚠️ Error al crear la reserva: ' + error.message);
    else       addToast('✓ Reserva creada');
  };

  const handleUpdateAppointment = async (aptId, updates) => {
    const apt   = appointments.find(a => a.id === aptId);
    const hora  = updates.hora  ?? apt?.time  ?? '00:00';
    const fecha = updates.fecha ?? apt?.date  ?? '';
    const payload = {
      ...(updates.nombre         !== undefined && { nombre:         updates.nombre }),
      ...(updates.telefono       !== undefined && { telefono:       updates.telefono }),
      ...(updates.fecha          !== undefined && { fecha:          updates.fecha }),
      ...(updates.hora           !== undefined && { hora:           updates.hora }),
      ...(updates.personas       !== undefined && { personas:       Number(updates.personas) }),
      ...(updates.salon_exterior !== undefined && { salon_exterior: updates.salon_exterior }),
      ...(updates.estado         !== undefined && { estado:         updates.estado }),
      ...(fecha                               && { fecha_iso:       `${fecha}T${hora}:00` }),
    };
    const { error } = await supabase.from('reservas').update(payload).eq('id', aptId);
    if (error) addToast('⚠️ Error al actualizar la reserva: ' + error.message);
    else       addToast('✓ Reserva actualizada');
  };

  const handleMoveAppointment = async (aptId, newDate) => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;
    const fechaIso = `${newDate}T${apt.time || '00:00'}:00`;
    setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, date: newDate } : a));
    const { error } = await supabase.from('reservas').update({ fecha: newDate, fecha_iso: fechaIso }).eq('id', aptId);
    if (error) {
      addToast('⚠️ No se pudo guardar. Ejecutá el SQL de permisos en Supabase.');
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, date: apt.date } : a));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            conversations={conversations}
            appointments={appointments}
            onNavigateToTab={setActiveTab}
            onSelectConversation={handleSelectConversation}
            onOpenDrawer={setDrawerConvId}
          />
        );
      case 'conversaciones':
        return (
          <ConversationsTab
            conversations={conversations}
            selectedConvId={selectedConvId}
            onSelectConversation={handleSelectConversation}
            onToggleBot={handleToggleBot}
            onSendMessage={handleSendMessage}
          />
        );
      case 'reservas':
        return (
          <CalendarTab
            appointments={appointments}
            onSelectConversation={handleSelectConversation}
            onMoveAppointment={handleMoveAppointment}
            onAddAppointment={handleAddAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            addToast={addToast}
          />
        );
      case 'configuracion-bot':
        return <ConfiguracionBotTab addToast={addToast} />;
      case 'integraciones':
        return <IntegrationsTab addToast={addToast} />;
      case 'inversores':
        return <InversoresTab addToast={addToast} />;
      default:
        return <div style={{ padding: '40px' }}>Sección no encontrada</div>;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':        return 'Dashboard';
      case 'conversaciones':   return 'Supervisor de Conversaciones';
      case 'reservas':         return 'Reservas';
      case 'configuracion-bot':return 'Panel de Administración';
      case 'integraciones':    return 'Integraciones de APIs';
      case 'inversores':       return 'Leads de Inversores';
      default:                 return 'Gestión';
    }
  };

  return (
    <div className="app-container" data-theme={darkMode ? 'dark' : 'light'}>
      <aside className="sidebar">
        <div className="logo-section" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
            Est. 2024
          </span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 900, letterSpacing: '0.1em', color: 'var(--text-primary)', lineHeight: 1, textTransform: 'uppercase' }}>
            Criollo
          </span>
          <div style={{ display: 'flex', gap: 5, margin: '6px 0 5px' }}>
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--accent-terracotta)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--accent-terracotta)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--accent-terracotta)', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Paladar Argento
          </span>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', color: 'var(--accent-terracotta)', textTransform: 'uppercase', marginTop: 8, paddingTop: 7, borderTop: '1px solid var(--border-color)', width: '100%' }}>
            Gestión
          </span>
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard className="nav-icon" /><span>Dashboard</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'conversaciones' ? 'active' : ''}`} onClick={() => setActiveTab('conversaciones')}>
              <MessageSquare className="nav-icon" /><span>Conversaciones</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'reservas' ? 'active' : ''}`} onClick={() => setActiveTab('reservas')}>
              <Calendar className="nav-icon" /><span>Reservas</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'inversores' ? 'active' : ''}`} onClick={() => setActiveTab('inversores')}>
              <Users className="nav-icon" /><span>Inversores</span>
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'configuracion-bot' ? 'active' : ''}`} onClick={() => setActiveTab('configuracion-bot')}>
              <Bot className="nav-icon" /><span>Panel Admin</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {session?.user?.user_metadata?.avatar_url
              ? <img src={session.user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : (session?.user?.email?.slice(0, 2).toUpperCase() ?? 'AD')
            }
          </div>
          <div className="user-info">
            <span className="user-name">
              {session?.user?.user_metadata?.full_name?.split(' ')[0] ?? session?.user?.email?.split('@')[0] ?? 'Admin'}
            </span>
            <span className="user-role">Dueño de Criollo</span>
          </div>
          <button className="signout-btn" onClick={() => setActiveTab('integraciones')} title="Integraciones"
            style={{ color: activeTab === 'integraciones' ? 'var(--accent-terracotta)' : undefined }}>
            <Settings size={16} />
          </button>
          <button className="signout-btn" onClick={() => supabase.auth.signOut()} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div className="header-title-section">
            <span className="header-title">{getTabTitle()}</span>
          </div>
          <div className="header-status-bar">
            <button onClick={toggleDarkMode} title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: 8, transition: 'var(--transition-fast)' }}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span style={{ textTransform: 'capitalize' }}>{now.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>{now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <div className="view-container">
          <ErrorBoundary resetKey={activeTab}>
            {renderTabContent()}
          </ErrorBoundary>
        </div>
      </main>

      {drawerConvId && (() => {
        const drawerConv = conversations.find(c => c.id === drawerConvId);
        return drawerConv ? (
          <ChatDrawer
            conv={drawerConv}
            onClose={() => setDrawerConvId(null)}
            onSendMessage={handleSendMessage}
            onToggleBot={handleToggleBot}
            onGoToFull={() => { handleSelectConversation(drawerConvId); setDrawerConvId(null); }}
          />
        ) : null;
      })()}

      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <AlertCircle size={16} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

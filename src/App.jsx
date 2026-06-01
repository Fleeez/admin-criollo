import React, { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Calendar, Settings, AlertCircle, LogOut } from 'lucide-react';
import { loadData, saveData, STORAGE_KEYS } from './mockData';
import { supabase } from './lib/supabaseClient';
import DashboardTab from './components/DashboardTab';
import ConversationsTab from './components/ConversationsTab';
import CalendarTab from './components/CalendarTab';
import IntegrationsTab from './components/IntegrationsTab';

function mapReserva(r) {
  const e = (r.estado ?? '').toLowerCase();
  const status = (e === 'cancelada' || e === 'cancelled' || e === 'canceled')
    ? 'cancelada'
    : (e === 'completada' || e === 'completed') ? 'completada' : 'pendiente';
  return {
    id: String(r.id),
    name: r.nombre,
    phone: r.telefono,
    date: r.fecha,
    time: r.hora,
    guests: r.personas,
    status,
  };
}

export default function App({ session }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [conversations, setConversations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [integrations, setIntegrations] = useState({});
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Load conversations & integrations from localStorage, appointments from Supabase
  useEffect(() => {
    const data = loadData();
    setConversations(data.conversations);
    setIntegrations(data.integrations);
    if (data.conversations.length > 0) {
      setSelectedConvId(data.conversations[0].id);
    }

    supabase
      .from('reservas')
      .select('*')
      .order('fecha_iso', { ascending: true })
      .then(({ data: rows, error }) => {
        if (error) { console.error('[Panel] Error cargando reservas:', error); return; }
        setAppointments((rows || []).map(mapReserva));
      });

    const channel = supabase
      .channel('reservas-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        supabase
          .from('reservas')
          .select('*')
          .order('fecha_iso', { ascending: true })
          .then(({ data: rows }) => setAppointments((rows || []).map(mapReserva)));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Toast notification manager
  const addToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Switch tabs and handle deep linking to chats
  const handleSelectConversation = (convId) => {
    setSelectedConvId(convId);
    setActiveTab('conversaciones');
  };

  // Toggle Bot Active status (supervised mode)
  const handleToggleBot = (convId) => {
    const updated = conversations.map(c => {
      if (c.id === convId) {
        const nextState = !c.botActive;
        addToast(nextState ? '✓ Bot reactivado para esta conversación' : '⏸ Bot pausado (atención humana activa)');
        return { ...c, botActive: nextState };
      }
      return c;
    });
    setConversations(updated);
    saveData(STORAGE_KEYS.CONVERSATIONS, updated);
  };

  // Send message manually (Intervention)
  const handleSendMessage = (convId, text) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const updated = conversations.map(c => {
      if (c.id === convId) {
        const newMsg = {
          id: `m_h_${Date.now()}`,
          sender: 'human',
          text,
          time: timeStr,
          date: 'Hoy'
        };
        
        // When sending manually, bot is automatically paused
        const wasActive = c.botActive;
        if (wasActive) {
          addToast('Intervención humana: Bot pausado automáticamente');
        }

        return {
          ...c,
          botActive: false,
          lastMessage: text,
          timestamp: 'ahora',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    });

    setConversations(updated);
    saveData(STORAGE_KEYS.CONVERSATIONS, updated);

    // Simulate customer replying back after 3 seconds
    setTimeout(() => {
      setConversations(currentConversations => {
        const targetConv = currentConversations.find(c => c.id === convId);
        if (!targetConv) return currentConversations;

        // Formulate customer reply
        let replyText = 'Perfecto, ¡gracias por responder!';
        if (targetConv.name === 'Agustín') {
          replyText = 'Buenísimo, entonces nos vemos a las 15:00. ¡Gracias!';
        } else if (targetConv.name === 'María') {
          replyText = 'Dale, confírmame si tienen mesa adentro o afuera por favor.';
        } else if (targetConv.name.includes('Carlos')) {
          replyText = 'Excelente, ¡hasta mañana!';
        }

        const customerMsg = {
          id: `m_c_${Date.now()}`,
          sender: 'client',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: 'Hoy'
        };

        const finalConversations = currentConversations.map(c => {
          if (c.id === convId) {
            addToast(`NUEVO MENSAJE de ${c.name}`);
            return {
              ...c,
              lastMessage: replyText,
              timestamp: 'ahora',
              messages: [...c.messages, customerMsg]
            };
          }
          return c;
        });

        saveData(STORAGE_KEYS.CONVERSATIONS, finalConversations);
        return finalConversations;
      });
    }, 3000);
  };

  // Save integrations
  const handleSaveIntegrations = (newIntegrations) => {
    setIntegrations(newIntegrations);
    saveData(STORAGE_KEYS.INTEGRATIONS, newIntegrations);
  };

  // Render correct tab view
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab 
            conversations={conversations} 
            appointments={appointments}
            onNavigateToTab={setActiveTab}
            onSelectConversation={handleSelectConversation}
          />
        );
      case 'conversaciones':
        return (
          <ConversationsTab 
            conversations={conversations}
            selectedConvId={selectedConvId}
            onSelectConversation={setSelectedConvId}
            onToggleBot={handleToggleBot}
            onSendMessage={handleSendMessage}
          />
        );
      case 'citas':
        return (
          <CalendarTab 
            appointments={appointments}
            onSelectConversation={handleSelectConversation}
            addToast={addToast}
          />
        );
      case 'integraciones':
        return (
          <IntegrationsTab 
            integrations={integrations}
            onSaveIntegrations={handleSaveIntegrations}
            addToast={addToast}
          />
        );
      default:
        return <div style={{ padding: '40px' }}>Sección no encontrada</div>;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'conversaciones': return 'Supervisor de Conversaciones';
      case 'citas': return 'Reservas & Citas';
      case 'integraciones': return 'Integraciones de APIs';
      default: return 'Gestión';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-icon">C</div>
          <div className="logo-text">
            <span className="logo-title">Criollo</span>
            <span className="logo-subtitle">Gestión</span>
          </div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="nav-icon" />
              <span>Dashboard</span>
            </button>
          </li>

          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'conversaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('conversaciones')}
            >
              <MessageSquare className="nav-icon" />
              <span>Conversaciones</span>
            </button>
          </li>

          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'citas' ? 'active' : ''}`}
              onClick={() => setActiveTab('citas')}
            >
              <Calendar className="nav-icon" />
              <span>Citas</span>
            </button>
          </li>

          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'integraciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('integraciones')}
            >
              <Settings className="nav-icon" />
              <span>Integraciones</span>
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
          <button
            className="signout-btn"
            onClick={() => supabase.auth.signOut()}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="app-header">
          <div className="header-title-section">
            <span className="header-title">{getTabTitle()}</span>
          </div>
          
          <div className="header-status-bar">
            {integrations.supabaseUrl && (
              <span className="status-badge connected">
                <span className="dot"></span> Supabase Conectado
              </span>
            )}
            {integrations.phoneId && (
              <span className="status-badge connected">
                <span className="dot"></span> WhatsApp API Activa
              </span>
            )}
          </div>
        </header>

        <div className="view-container">
          {renderTabContent()}
        </div>
      </main>

      {/* Toast Notification Container */}
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

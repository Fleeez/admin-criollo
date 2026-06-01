import React, { useState } from 'react';
import { Save, Copy, Check, Info, Server, Calendar, MessageCircle } from 'lucide-react';

export default function IntegrationsTab({ integrations, onSaveIntegrations, addToast }) {
  const [formData, setFormData] = useState({ ...integrations });
  const [copiedField, setCopiedField] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveIntegrations(formData);
    addToast('✓ Configuraciones guardadas y validadas con éxito');
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(`Copiado: ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sqlSchema = `
-- TABLA DE CONVERSACIONES
create table conversations (
  id uuid default gen_random_uuid() primary key,
  phone text unique not null,
  name text,
  bot_active boolean default true,
  last_message text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE MENSAJES DE WHATSAPP
create table messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  sender text not null check (sender in ('client', 'ai', 'human')),
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TABLA DE RESERVAS (CITAS)
create table appointments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  date date not null,
  time time not null,
  guests integer not null,
  status text default 'pendiente' check (status in ('pendiente', 'completada', 'cancelada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
  `.trim();

  return (
    <div className="integrations-wrapper">
      <form onSubmit={handleSave}>
        {/* WhatsApp Cloud API Section */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <MessageCircle size={24} color="var(--accent-terracotta)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>WhatsApp Cloud API</h3>
          </div>
          <p className="form-section-desc">
            Conecta tu número de WhatsApp Business gestionado en Meta para recibir y responder mensajes en tiempo real.
          </p>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Phone Number ID</label>
              <input 
                type="text" 
                name="phoneId"
                className="form-input" 
                placeholder="Ej. 123456789012345" 
                value={formData.phoneId}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">WABA ID (WhatsApp Business Account)</label>
              <input 
                type="text" 
                name="wabaId"
                className="form-input" 
                placeholder="Ej. 987654321098765" 
                value={formData.wabaId}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Access Token (System User User Token, "Never expires")</label>
            <input 
              type="password" 
              name="accessToken"
              className="form-input" 
              placeholder="EAAG..." 
              value={formData.accessToken}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">App Secret</label>
              <input 
                type="password" 
                name="appSecret"
                className="form-input" 
                placeholder="Tu App Secret de Meta" 
                value={formData.appSecret}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Secreto del verify token</label>
              <input 
                type="text" 
                name="verifyToken"
                className="form-input" 
                placeholder="Texto aleatorio para verificación del Webhook" 
                value={formData.verifyToken}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            <Save size={16} /> Guardar y validar credenciales
          </button>
        </div>

        {/* Webhook Configuration Section */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Info size={22} color="var(--accent-olive)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Configuración de Webhook en Meta</h3>
          </div>
          <p className="form-section-desc">
            Copia estos valores en la sección <b>Webhooks</b> de tu aplicación en Meta Developers. Suscríbete a los eventos <b>messages</b> y <b>message_deliveries</b>.
          </p>

          <div className="webhook-info-panel">
            <div className="webhook-item">
              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Callback URL</span>
                <div className="webhook-value">https://admin-criollo.vercel.app/webhook</div>
              </div>
              <button
                type="button"
                className="btn-copy"
                onClick={() => handleCopy('https://admin-criollo.vercel.app/webhook', 'Callback URL')}
              >
                {copiedField === 'Callback URL' ? <Check size={16} color="green" /> : <Copy size={16} />}
              </button>
            </div>

            <div className="webhook-item">
              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Verify Token</span>
                <div className="webhook-value">{formData.verifyToken || 'Define un Verify Token arriba'}</div>
              </div>
              <button 
                type="button"
                className="btn-copy" 
                disabled={!formData.verifyToken}
                onClick={() => handleCopy(formData.verifyToken, 'Verify Token')}
              >
                {copiedField === 'Verify Token' ? <Check size={16} color="green" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Supabase Section */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Server size={22} color="var(--accent-gold)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Base de Datos Supabase</h3>
          </div>
          <p className="form-section-desc">
            Sincroniza en tiempo real los mensajes recibidos e interacciones del chatbot con tu panel web.
          </p>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">Supabase URL del Proyecto</label>
              <input 
                type="url" 
                name="supabaseUrl"
                className="form-input" 
                placeholder="https://xxxx.supabase.co" 
                value={formData.supabaseUrl}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Public Anon Key</label>
              <input 
                type="password" 
                name="supabaseAnonKey"
                className="form-input" 
                placeholder="eyJhbGciOi..." 
                value={formData.supabaseAnonKey}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <span className="form-label" style={{ display: 'block', marginBottom: '6px' }}>Esquema SQL Inicial Requerido</span>
            <span className="form-section-desc" style={{ display: 'block', marginBottom: '10px' }}>
              Ejecuta este código en el editor SQL de Supabase para inicializar las tablas necesarias de mensajería y reservas.
            </span>
            <div className="sql-script-box">
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{sqlSchema}</pre>
            </div>
          </div>
        </div>

        {/* Google Calendar Section */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Calendar size={22} color="var(--accent-olive)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Integración Google Calendar API</h3>
          </div>
          <p className="form-section-desc">
            Agenda de forma automática las reservas acordadas por el bot de WhatsApp en el calendario de tu restaurante.
          </p>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Google API Client ID (OAuth2)</label>
            <input 
              type="text" 
              name="calendarClientId"
              className="form-input" 
              placeholder="xxxx.apps.googleusercontent.com" 
              value={formData.calendarClientId}
              onChange={handleInputChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ backgroundColor: 'var(--accent-olive)' }}
              onClick={() => addToast('Google OAuth2 popup simulado...')}
            >
              Vincular cuenta Google
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

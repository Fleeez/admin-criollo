import React, { useState, useEffect } from 'react';
import { Save, Copy, Check, Info, Server, Calendar, MessageCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const FRANQUICIA_ID = 'demo-restaurant';

export default function IntegrationsTab({ addToast }) {
  const [formData, setFormData] = useState({
    evolution_api_url:         '',
    evolution_api_key:         '',
    evolution_instance:        '',
    webhook_verify_token:      '',
    google_calendar_client_id: '',
  });
  const [copiedField,   setCopiedField]   = useState(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [loadError,     setLoadError]     = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    supabase
      .from('integraciones')
      .select('*')
      .eq('franquicia_id', FRANQUICIA_ID)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setLoadError(error.message);
        } else if (data) {
          setFormData({
            evolution_api_url:         data.evolution_api_url         ?? '',
            evolution_api_key:         data.evolution_api_key         ?? '',
            evolution_instance:        data.evolution_instance        ?? '',
            webhook_verify_token:      data.webhook_verify_token      ?? '',
            google_calendar_client_id: data.google_calendar_client_id ?? '',
          });
        }
        setIsLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('integraciones')
        .upsert(
          {
            franquicia_id:             FRANQUICIA_ID,
            evolution_api_url:         formData.evolution_api_url.trim()         || null,
            evolution_api_key:         formData.evolution_api_key.trim()         || null,
            evolution_instance:        formData.evolution_instance.trim()        || null,
            webhook_verify_token:      formData.webhook_verify_token.trim()      || null,
            google_calendar_client_id: formData.google_calendar_client_id.trim() || null,
            updated_at:                new Date().toISOString(),
          },
          { onConflict: 'franquicia_id' }
        );
      if (error) throw error;
      addToast('✓ Configuración guardada en Supabase');
    } catch (err) {
      addToast('⚠️ Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(`Copiado: ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Cargando configuración...
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ background: 'rgba(216,67,21,0.1)', border: '1px solid rgba(216,67,21,0.3)', borderRadius: 12, padding: '24px 28px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--status-paused-text)', marginBottom: 8 }}>
            ⚠️ No se pudo cargar la configuración
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{loadError}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Si la tabla <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.1)', padding: '1px 5px', borderRadius: 4 }}>integraciones</code> no existe, ejecutá la migración SQL v2 en el Editor SQL de Supabase.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-wrapper">
      <form onSubmit={handleSave}>

        {/* Evolution API (WhatsApp Gateway) */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <MessageCircle size={24} color="var(--accent-terracotta)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Evolution API — Gateway de WhatsApp</h3>
          </div>
          <p className="form-section-desc">
            Bruno usa Evolution API para enviar y recibir mensajes de WhatsApp.
            Estos datos también están en el <code style={{ fontFamily: 'monospace', fontSize: 12 }}>.env</code> del servidor.
            Configurarlos aquí permite conectar el panel admin cuando se active el envío de mensajes.
          </p>

          <div className="input-grid">
            <div className="form-group">
              <label className="form-label">URL de Evolution API</label>
              <input
                type="url"
                name="evolution_api_url"
                className="form-input"
                placeholder="http://localhost:8080"
                value={formData.evolution_api_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instance Name</label>
              <input
                type="text"
                name="evolution_instance"
                className="form-input"
                placeholder="bruno"
                value={formData.evolution_instance}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">API Key</label>
            <input
              type="password"
              name="evolution_api_key"
              className="form-input"
              placeholder="Tu API Key de Evolution"
              value={formData.evolution_api_key}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
            <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>

        {/* Webhook Info */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Info size={22} color="var(--accent-olive)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Configuración de Webhook</h3>
          </div>
          <p className="form-section-desc">
            Configura estos valores en tu instancia de Evolution API o en Meta Developers.
          </p>

          <div className="webhook-info-panel">
            <div className="webhook-item">
              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Webhook URL del Bot</span>
                <div className="webhook-value">
                  {formData.evolution_api_url
                    ? `${formData.evolution_api_url.replace(/\/$/, '')}/webhook`
                    : 'Configurá la URL de Evolution API arriba'}
                </div>
              </div>
              {formData.evolution_api_url && (
                <button
                  type="button"
                  className="btn-copy"
                  onClick={() => handleCopy(`${formData.evolution_api_url.replace(/\/$/, '')}/webhook`, 'Webhook URL')}
                >
                  {copiedField === 'Webhook URL' ? <Check size={16} color="green" /> : <Copy size={16} />}
                </button>
              )}
            </div>

            <div className="webhook-item">
              <div>
                <span className="form-label" style={{ fontSize: '10px' }}>Verify Token</span>
                <input
                  type="text"
                  name="webhook_verify_token"
                  className="form-input"
                  placeholder="Token aleatorio para verificación del Webhook"
                  value={formData.webhook_verify_token}
                  onChange={handleInputChange}
                  style={{ marginTop: 4, fontSize: 13 }}
                />
              </div>
              <button
                type="button"
                className="btn-copy"
                disabled={!formData.webhook_verify_token}
                style={{ marginTop: 22 }}
                onClick={() => handleCopy(formData.webhook_verify_token, 'Verify Token')}
              >
                {copiedField === 'Verify Token' ? <Check size={16} color="green" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Calendar size={22} color="var(--accent-olive)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Google Calendar API</h3>
          </div>
          <p className="form-section-desc">
            Próximamente: agendá reservas directamente en Google Calendar.
            Ingresá tu Client ID de OAuth2 para activarlo cuando esté disponible.
          </p>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Google API Client ID (OAuth2)</label>
            <input
              type="text"
              name="google_calendar_client_id"
              className="form-input"
              placeholder="xxxx.apps.googleusercontent.com"
              value={formData.google_calendar_client_id}
              onChange={handleInputChange}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ backgroundColor: 'var(--accent-olive)', opacity: 0.6, cursor: 'not-allowed' }}
            onClick={() => addToast('Google Calendar aún no está disponible. Guardá tu Client ID para cuando se active.')}
            disabled
          >
            Vincular cuenta Google — Próximamente
          </button>
        </div>

        {/* Supabase info */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Server size={22} color="var(--accent-gold)" />
            <h3 className="form-section-title" style={{ marginBottom: 0 }}>Base de Datos Supabase</h3>
          </div>
          <p className="form-section-desc">
            Las credenciales de Supabase se configuran vía variables de entorno en Vercel (<code style={{ fontFamily: 'monospace', fontSize: 12 }}>VITE_SUPABASE_URL</code> y <code style={{ fontFamily: 'monospace', fontSize: 12 }}>VITE_SUPABASE_ANON_KEY</code>).
            El panel ya está conectado.
          </p>
          <div style={{
            background: 'rgba(67,160,71,0.08)', border: '1px solid rgba(67,160,71,0.25)',
            borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ color: '#2E7D32', fontWeight: 700 }}>●</span>
            Conectado a Supabase correctamente
          </div>
        </div>

      </form>
    </div>
  );
}

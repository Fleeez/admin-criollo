import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Trash2, MessageSquare } from 'lucide-react';

function daysRemaining(deletedAt) {
  const diff = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(deletedAt).getTime());
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getAvatarGradient(name = '') {
  const palettes = [
    ['#C05C3E', '#E8845F'], ['#4F6D7A', '#7AA3B5'], ['#7B5EA7', '#A585CC'],
    ['#2D6A4F', '#52B788'], ['#B5563F', '#D48A6C'], ['#1D4E89', '#4A90C8'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = palettes[Math.abs(h) % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function PapeleraConversaciones({ trashConversations, onRestore, onPermanentDelete, onBack }) {
  const [confirmId, setConfirmId] = useState(null); // convId pendiente de borrado permanente

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: 4 }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Papelera de conversaciones</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          Las conversaciones se eliminan definitivamente a los 7 días
        </span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {trashConversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
            <MessageSquare size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>La papelera está vacía</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {trashConversations.map(conv => {
              const days = daysRemaining(conv.deletedAt);
              return (
                <div key={conv.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: getAvatarGradient(conv.name),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700, color: '#fff', opacity: 0.7,
                  }}>
                    {conv.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{conv.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{conv.phone}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Borrado: {formatDate(conv.deletedAt)} ·{' '}
                      <span style={{ color: days <= 1 ? '#D4574E' : 'var(--text-tertiary)' }}>
                        {days === 0 ? 'Se elimina hoy' : `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => onRestore(conv.id)}
                      title="Restaurar conversación"
                      style={{
                        background: 'rgba(91,154,107,0.1)', border: '1px solid rgba(91,154,107,0.35)',
                        color: '#5B9A6B', borderRadius: 7, padding: '6px 12px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      <RotateCcw size={13} /> Restaurar
                    </button>

                    {confirmId === conv.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 12 }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => { onPermanentDelete(conv.id); setConfirmId(null); }}
                          style={{ background: 'rgba(212,87,78,0.15)', border: '1px solid rgba(212,87,78,0.4)', color: '#D4574E', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(conv.id)}
                        title="Eliminar permanentemente"
                        style={{
                          background: 'transparent', border: '1px solid rgba(212,87,78,0.3)',
                          color: '#D4574E', borderRadius: 7, padding: '6px 8px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

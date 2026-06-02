import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ExternalLink } from 'lucide-react';

export default function ChatDrawer({ conv, onClose, onSendMessage, onToggleBot, onGoToFull }) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(conv.id, text.trim());
    setText('');
  };

  return (
    <>
      <div className="chat-drawer-backdrop" onClick={onClose} />
      <div className="chat-drawer">
        {/* Header */}
        <div className="chat-drawer-header">
          <div className="chat-window-avatar" style={{ width: 36, height: 36, fontSize: 15, flexShrink: 0 }}>
            {conv.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.name}
            </div>
            <div style={{ fontSize: 11, color: conv.botActive ? 'var(--status-active-text)' : 'var(--accent-terracotta)', fontWeight: 600 }}>
              {conv.botActive ? '• Bruno Activo' : '• Intervención Manual'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bruno</span>
            <label className="switch" style={{ transform: 'scale(0.85)' }}>
              <input type="checkbox" checked={conv.botActive} onChange={() => onToggleBot(conv.id)} />
              <span className="slider"></span>
            </label>
          </div>

          <button
            title="Conversación completa"
            onClick={onGoToFull}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="chat-drawer-messages">
          {conv.messages.map((msg, i) => {
            const isClient = msg.sender === 'client';
            const isAI     = msg.sender === 'ai';
            const isHuman  = msg.sender === 'human';
            return (
              <div
                key={msg.id || i}
                className={`message-wrapper ${isClient ? 'msg-left' : 'msg-right'} ${isAI ? 'bot' : isHuman ? 'human' : ''}`}
              >
                <div className="message-meta">
                  {isClient && <span className="sender-tag tag-client">Cliente</span>}
                  {isAI     && <span className="sender-tag tag-ai">Bruno</span>}
                  {isHuman  && <span className="sender-tag tag-human">Humano</span>}
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{msg.time}</span>
                </div>
                <div className="message-bubble" style={{ fontSize: 13 }}>{msg.text}</div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form className="chat-drawer-input" onSubmit={handleSend}>
          <textarea
            className="chat-drawer-textarea"
            placeholder={conv.botActive ? 'Intervenir (pausará a Bruno)...' : 'Responder como humano...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <button
            type="submit"
            className="btn-send"
            disabled={!text.trim()}
            style={{ width: 40, height: 40, flexShrink: 0 }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MessageSquare, ArrowLeft, Bot, User } from 'lucide-react';

// Deterministic gradient per contact name
function getAvatarGradient(name = '') {
  const palettes = [
    ['#C05C3E', '#E8845F'],
    ['#4F6D7A', '#7AA3B5'],
    ['#7B5EA7', '#A585CC'],
    ['#2D6A4F', '#52B788'],
    ['#B5563F', '#D48A6C'],
    ['#1D4E89', '#4A90C8'],
    ['#7A5C00', '#C49A2A'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = palettes[Math.abs(h) % palettes.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function formatPhone(phone = '') {
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,8)}-${d.slice(8)}`;
  if (d.length === 11)  return `+${d.slice(0,2)} ${d.slice(2,7)}-${d.slice(7)}`;
  return `+${d}`;
}

export default function ConversationsTab({
  conversations,
  selectedConvId,
  onSelectConversation,
  onToggleBot,
  onSendMessage
}) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [messageText, setMessageText]   = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [mobileView, setMobileView]     = useState('list');

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages?.length]);

  useEffect(() => {
    if (selectedConvId) setMobileView('chat');
  }, [selectedConvId]);

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setMessageText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = '44px';
      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendMessage(selectedConv.id, messageText.trim());
    setMessageText('');
    if (textareaRef.current) textareaRef.current.style.height = '44px';
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Build messages with date separators
  const renderMessages = (messages = []) => {
    const items = [];
    let lastDate = null;
    let lastSender = null;

    messages.forEach((msg, i) => {
      const isNewDate = msg.date !== lastDate;
      if (isNewDate) {
        items.push(
          <div key={`date-${i}`} className="date-separator">
            <span>{msg.date}</span>
          </div>
        );
        lastDate = msg.date;
        lastSender = null;
      }

      const isClient = msg.sender === 'client';
      const isAI     = msg.sender === 'ai';
      const isHuman  = msg.sender === 'human';
      const isSameSender = msg.sender === lastSender && !isNewDate;
      lastSender = msg.sender;

      items.push(
        <div
          key={msg.id || i}
          className={`message-wrapper ${isClient ? 'msg-left' : 'msg-right'} ${isAI ? 'bot' : ''} ${isHuman ? 'human' : ''} ${isSameSender ? 'same-sender' : ''}`}
        >
          {!isSameSender && (
            <div className="message-meta">
              {isClient && <span className="sender-tag tag-client"><User size={9} />Cliente</span>}
              {isAI     && <span className="sender-tag tag-ai"><Bot size={9} />Bruno IA</span>}
              {isHuman  && <span className="sender-tag tag-human">👤 Humano</span>}
            </div>
          )}
          <div className="message-bubble" title={msg.time}>
            {msg.text}
          </div>
          <span className="message-time">{msg.time}</span>
        </div>
      );
    });

    return items;
  };

  return (
    <div className="chat-tab-container">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className={`chat-list-panel ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
        <div className="chat-list-header">
          <h3 className="chat-list-title">Conversaciones</h3>
          <p className="chat-list-subtitle">{conversations.length} activa{conversations.length !== 1 ? 's' : ''}</p>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ul className="chat-items-list">
          {filteredConversations.map(conv => {
            const isActive = selectedConv?.id === conv.id;
            return (
              <li key={conv.id} className={`chat-item ${isActive ? 'active' : ''}`}>
                <button className="chat-item-btn" onClick={() => {
                  onSelectConversation(conv.id);
                  setMobileView('chat');
                }}>
                  <div
                    className="user-cell-avatar"
                    style={{ background: getAvatarGradient(conv.name) }}
                  >
                    {conv.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-item-details">
                    <div className="chat-item-top">
                      <span className="chat-item-name">{conv.name}</span>
                      <span className="chat-item-time">{conv.timestamp}</span>
                    </div>
                    <div className="chat-item-bottom">
                      <span className="chat-item-msg">{conv.lastMessage}</span>
                      <span className={`badge ${conv.botActive ? 'badge-bot' : 'badge-manual'}`}>
                        {conv.botActive ? 'Bruno' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
          {filteredConversations.length === 0 && (
            <div className="chat-empty-list">
              <Search size={22} />
              <p>Sin resultados</p>
            </div>
          )}
        </ul>
      </div>

      {/* ── Chat Window ─────────────────────────────────────────────────── */}
      {selectedConv ? (
        <div className={`chat-window ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>

          {/* Header */}
          <div className="chat-window-header">
            <div className="chat-window-user-info">
              {mobileView === 'chat' && (
                <button
                  onClick={() => setMobileView('list')}
                  className="btn-back-mobile"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div
                className="chat-window-avatar"
                style={{ background: getAvatarGradient(selectedConv.name) }}
              >
                {selectedConv.name.charAt(0).toUpperCase()}
              </div>
              <div className="chat-window-name-section">
                <span className="chat-window-name">{selectedConv.name}</span>
                <div className="chat-window-meta">
                  <span className={`status-dot ${selectedConv.botActive ? 'active' : 'paused'}`} />
                  <span className={`chat-window-status ${selectedConv.botActive ? 'bot-active' : 'bot-paused'}`}>
                    {selectedConv.botActive ? 'Bruno activo' : 'Intervención manual'}
                  </span>
                  <span className="chat-window-phone">{formatPhone(selectedConv.phone)}</span>
                </div>
              </div>
            </div>

            <div className="bot-toggle-wrapper">
              <span className="bot-toggle-label">
                {selectedConv.botActive ? 'Bruno Activo' : 'Bruno Pausado'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={selectedConv.botActive}
                  onChange={() => onToggleBot(selectedConv.id)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages-container">
            {(selectedConv.messages || []).length === 0 ? (
              <div className="chat-messages-empty">
                <MessageSquare size={28} />
                <p>Aún no hay mensajes en esta conversación.</p>
              </div>
            ) : (
              renderMessages(selectedConv.messages)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className={`chat-input-bar ${inputFocused ? 'focused' : ''}`} onSubmit={handleSendMessage}>
            <div className="chat-input-inner">
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder={selectedConv.botActive
                  ? 'Intervenir como humano (pausará a Bruno)...'
                  : 'Responder como humano...'}
                value={messageText}
                onChange={handleTextareaChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <button
                type="submit"
                className="btn-send"
                disabled={!messageText.trim()}
                title="Enviar (Enter)"
              >
                <Send size={17} />
              </button>
            </div>
            {inputFocused && (
              <p className="chat-input-hint">Shift+Enter para salto de línea</p>
            )}
          </form>

        </div>
      ) : (
        <div className="chat-empty-state">
          <div className="chat-empty-icon-wrap">
            <MessageSquare size={36} />
          </div>
          <p className="chat-empty-title">Seleccioná una conversación</p>
          <p className="chat-empty-sub">Supervisá y respondé mensajes de WhatsApp en tiempo real.</p>
        </div>
      )}
    </div>
  );
}

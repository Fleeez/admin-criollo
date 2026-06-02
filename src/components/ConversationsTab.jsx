import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export default function ConversationsTab({ 
  conversations, 
  selectedConvId, 
  onSelectConversation, 
  onToggleBot, 
  onSendMessage 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'chat'
  
  const messagesEndRef = useRef(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || conversations[0];

  // Auto scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConv?.messages]);

  // Sync mobile view status when selected conversation changes
  useEffect(() => {
    if (selectedConvId) {
      setMobileView('chat');
    }
  }, [selectedConvId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendMessage(selectedConv.id, messageText.trim());
    setMessageText('');
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="chat-tab-container">
      {/* Sidebar with Chats List */}
      <div className={`chat-list-panel ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
        <div className="chat-list-header">
          <h3 className="chat-list-title">Conversaciones</h3>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por cliente o teléfono..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ul className="chat-items-list">
          {filteredConversations.map(conv => (
            <li key={conv.id} className={`chat-item ${selectedConv?.id === conv.id ? 'active' : ''}`}>
              <button className="chat-item-btn" onClick={() => {
                onSelectConversation(conv.id);
                setMobileView('chat');
              }}>
                <div className="user-cell-avatar">
                  {conv.name.charAt(0)}
                </div>
                <div className="chat-item-details">
                  <div className="chat-item-top">
                    <span className="chat-item-name">{conv.name}</span>
                    <span className="chat-item-time">{conv.timestamp}</span>
                  </div>
                  <div className="chat-item-bottom">
                    <span className="chat-item-msg">{conv.lastMessage}</span>
                    <span className={`badge ${conv.botActive ? 'badge-bot' : 'badge-manual'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {conv.botActive ? 'Bruno' : 'Manual'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
          {filteredConversations.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No se encontraron chats
            </div>
          )}
        </ul>
      </div>

      {/* Active Conversation Detail */}
      {selectedConv ? (
        <div className={`chat-window ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
          {/* Header */}
          <div className="chat-window-header">
            <div className="chat-window-user-info">
              <button 
                onClick={() => setMobileView('list')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                className="hidden-mobile"
              >
                <ArrowLeft size={20} color="var(--text-primary)" />
              </button>
              
              <div className="chat-window-avatar">
                {selectedConv.name.charAt(0)}
              </div>
              <div className="chat-window-name-section">
                <span className="chat-window-name">{selectedConv.name}</span>
                <span className={`chat-window-status ${selectedConv.botActive ? 'bot-active' : 'bot-paused'}`}>
                  {selectedConv.botActive ? '• Bruno Activo' : '• Intervención Manual'}
                </span>
              </div>
            </div>

            <div className="bot-toggle-wrapper">
              <span className="bot-toggle-label">Bruno activo</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={selectedConv.botActive} 
                  onChange={() => onToggleBot(selectedConv.id)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Messages Container */}
          <div className="chat-messages-container">
            {selectedConv.messages.map((msg, i) => {
              const isClient = msg.sender === 'client';
              const isAI = msg.sender === 'ai';
              const isHuman = msg.sender === 'human';
              
              return (
                <div key={msg.id || i} className={`message-wrapper ${isClient ? 'msg-left' : 'msg-right'} ${isAI ? 'bot' : isHuman ? 'human' : ''}`}>
                  <div className="message-meta">
                    {isClient && <span className="sender-tag tag-client">Cliente</span>}
                    {isAI && <span className="sender-tag tag-ai">Agente IA</span>}
                    {isHuman && <span className="sender-tag tag-human">Humano</span>}
                    <span>{msg.time}</span>
                  </div>
                  <div className="message-bubble">
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <textarea 
              className="chat-textarea" 
              placeholder={selectedConv.botActive ? "Escribe un mensaje para intervenir (esto pausará a Bruno)..." : "Responder como humano..."}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button 
              type="submit" 
              className="btn-send"
              disabled={!messageText.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="chat-empty-state">
          <MessageSquare className="empty-state-icon" />
          <p>Selecciona una conversación para comenzar a supervisar.</p>
        </div>
      )}
    </div>
  );
}

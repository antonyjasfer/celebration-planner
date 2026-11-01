import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Sparkles, Trash2, Bot, User,
  CornerDownLeft, ShieldCheck, Heart, Lightbulb
} from 'lucide-react';
import { addChatMessage, updateEvent } from '../services/eventStore';
import { chat } from '../services/gemini';
import './ChatPage.css';

const QUICK_PROMPTS = [
  'How can I reduce catering costs without compromising quality?',
  'What non-negotiable questions should I ask my photographer?',
  'Suggest 3 fun interactive games for all age groups',
  'Draft a polite WhatsApp message to chase pending RSVPs',
  'What are common hidden vendor charges to watch out for?'
];

export default function ChatPage({ event, showToast }) {
  const [messages, setMessages] = useState(() => {
    const history = event.chatHistory || [];
    if (history.length === 0) {
      return [
        {
          role: 'assistant',
          content: `Hello! I'm your **CelebriPlan AI Planning Partner** for **${event.eventName}**. 

I have all your event parameters loaded:
- **Type**: ${event.eventType}
- **Budget**: ₹${Number(event.budget).toLocaleString('en-IN')}
- **Guest Headcount**: ${event.guestCount}
- **Target Date**: ${event.eventDate || 'Set on dashboard'}
- **Priorities**: ${event.priorities || 'Balanced'}

Ask me anything — from vendor negotiation tactics, budget tradeoff simulations, catering menus, to timeline troubleshooting!`,
          timestamp: new Date().toISOString()
        }
      ];
    }
    return history;
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || isTyping) return;

    const userMsg = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    // Save to event store
    addChatMessage(event.id, 'user', messageContent);

    try {
      const aiReply = await chat(newHistory, event);
      const assistantMsg = {
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);
      addChatMessage(event.id, 'assistant', aiReply);
    } catch (err) {
      console.error('Chat error:', err);
      showToast('Could not complete response. Try again.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all chat messages for this event?')) {
      updateEvent(event.id, { chatHistory: [] });
      setMessages([
        {
          role: 'assistant',
          content: `Chat history cleared. What would you like to plan next for **${event.eventName}**?`,
          timestamp: new Date().toISOString()
        }
      ]);
      showToast('Chat history cleared', 'info');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-page animate-fade-in" id="chat-page">
      {/* Top Header */}
      <div className="chat-header glass-card">
        <div className="chat-header-info">
          <div className="ai-avatar">
            <Bot size={22} />
          </div>
          <div>
            <h1 className="chat-title">CelebriPlan AI Assistant</h1>
            <p className="chat-subtitle">
              Context-aware planning partner for <strong>{event.eventName}</strong>
            </p>
          </div>
        </div>

        <button
          className="btn-danger-ghost btn-sm"
          onClick={handleClearHistory}
          title="Clear conversation"
          id="btn-clear-chat"
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="quick-prompts-bar">
        <span className="prompts-label">Prompt Ideas:</span>
        <div className="prompts-scroll">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="quick-prompt-chip"
              onClick={() => handleSendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="messages-stream glass-card" id="chat-messages-container">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`message-bubble-row ${isUser ? 'user-row' : 'assistant-row'}`}
            >
              <div className="bubble-avatar">
                {isUser ? <User size={16} /> : <Sparkles size={16} />}
              </div>

              <div className="bubble-wrapper">
                <div className="bubble-header">
                  <span className="sender-name">{isUser ? 'You' : 'CelebriPlan AI'}</span>
                  {msg.timestamp && (
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <div className="bubble-text">
                  {msg.content.split('\n').map((line, lineIdx) => {
                    if (line.startsWith('### ')) {
                      return <h4 key={lineIdx} className="chat-h4">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={lineIdx} className="chat-li">{line.replace('- ', '')}</li>;
                    }
                    return line ? <p key={lineIdx} className="chat-p">{line}</p> : <br key={lineIdx} />;
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="message-bubble-row assistant-row typing-row">
            <div className="bubble-avatar">
              <Sparkles size={16} className="spin-icon" />
            </div>
            <div className="bubble-wrapper">
              <div className="typing-indicator">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="chat-input-container glass-card">
        <textarea
          className="chat-textarea"
          placeholder="Ask CelebriPlan AI anything about your event... (Press Enter to send)"
          rows={1}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          id="chat-user-input"
        />
        <button
          className="btn-primary btn-send"
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isTyping}
          id="btn-send-chat"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

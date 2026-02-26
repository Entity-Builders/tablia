import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';
import type { ChatMessage, MenuCategory, MenuItem } from '../types';
import { buildMenuContext, sendChatMessage } from '../services/chat-service';
import './MenuChat.css';

interface MenuChatProps {
  venueSlug: string;
  venueName: string;
  categories: (MenuCategory & { items: MenuItem[] })[];
  onClose: () => void;
  /** When true, hides the close button (used in landing demo) */
  isDemo?: boolean;
}

const QUICK_ACTIONS = [
  '¿Opciones veganas?',
  '¿Qué me recomendás?',
  '¿Tienen sin TACC?',
  '¿Qué postres tienen?',
];

export function MenuChat({
  venueSlug,
  venueName,
  categories,
  onClose,
  isDemo = false,
}: MenuChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize menu context string
  const menuContext = useRef(buildMenuContext(categories)).current;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        venueSlug,
        venueName,
        menuContext,
        messages,
        message,
      );

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content:
          'Perdón, tuve un problema para responder. ¿Podés intentar de nuevo?',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='menu-chat'>
      {/* Header */}
      <div className='menu-chat__header'>
        <div className='menu-chat__header-info'>
          <Sparkles size={16} />
          <h3>Preguntale al menú</h3>
        </div>
        {!isDemo && (
          <button className='menu-chat__close' onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className='menu-chat__body'>
        {/* Welcome */}
        <div className='menu-chat__bubble menu-chat__bubble--assistant'>
          <p>
            ¡Hola! 👋 Soy el asistente de <strong>{venueName}</strong>.
            Preguntame lo que quieras: alergenos, recomendaciones, porciones...
          </p>
        </div>

        {/* Quick actions (only if no messages yet) */}
        {messages.length === 0 && (
          <div className='menu-chat__quick-actions'>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                className='menu-chat__chip'
                onClick={() => handleSend(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`menu-chat__bubble menu-chat__bubble--${msg.role}`}
          >
            <p>{msg.content}</p>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className='menu-chat__bubble menu-chat__bubble--assistant menu-chat__bubble--loading'>
            <Loader2 size={16} className='menu-chat__spin' />
            <span>Pensando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className='menu-chat__input-area'>
        <input
          ref={inputRef}
          type='text'
          className='menu-chat__input'
          placeholder='Ej: ¿Qué tienen sin gluten?'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className='menu-chat__send'
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

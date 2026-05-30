import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';
import type { ChatMessage, ChatPersona, MenuCategory, MenuItem } from '../types';
import { buildMenuContext, sendChatMessage } from '../services/chat-service';
import './MenuChat.css';

interface MenuChatProps {
  venueSlug: string;
  venueName: string;
  categories: (MenuCategory & { items: MenuItem[] })[];
  onClose: () => void;
  /** When true, hides the close button (used in landing demo) */
  isDemo?: boolean;
  /** Optional first prompt submitted by the menu assistant bar. */
  initialPrompt?: string;
  /** Venue-configured assistant voice. */
  chatPersona?: ChatPersona;
}

const QUICK_ACTIONS = [
  'Recomendame algo',
  'Algo para compartir',
  'Sin TACC',
  'Postre ideal',
];

export function MenuChat({
  venueSlug,
  venueName,
  categories,
  onClose,
  isDemo = false,
  initialPrompt,
  chatPersona,
}: MenuChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialPromptSent = useRef(false);
  const hasActiveConversation = messages.length > 0;

  // Memoize menu context string
  const menuContext = useRef(buildMenuContext(categories)).current;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
        chatPersona,
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!initialPrompt || initialPromptSent.current) return;
    initialPromptSent.current = true;
    void handleSend(initialPrompt);
    // Only auto-submit once when the chat opens from the assistant bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

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
          <Sparkles size={16} aria-hidden='true' />
          <h3>Preguntale al menú</h3>
        </div>
        {!isDemo && (
          <button
            className='menu-chat__close'
            onClick={onClose}
            aria-label='Cerrar chat'
          >
            <X size={18} aria-hidden='true' />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className='menu-chat__body'>
        {/* Welcome */}
        <div className='menu-chat__bubble menu-chat__bubble--assistant'>
          <p>
            Soy el asistente de <strong>{venueName}</strong>. Puedo sugerirte
            platos, porciones, alergenos y combinaciones usando este menú.
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
          name='menu-chat-question'
          className='menu-chat__input'
          placeholder={
            hasActiveConversation
              ? 'Seguile preguntando al menú…'
              : 'Ej: ¿Qué tienen sin gluten?…'
          }
          aria-label='Escribí una pregunta sobre el menú'
          autoComplete='off'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className='menu-chat__send'
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          aria-label='Enviar pregunta'
        >
          <Send size={18} aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

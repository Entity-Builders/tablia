import { useParams } from 'react-router-dom';
import { UtensilsCrossed, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import './MenuView.css';

/**
 * MenuView — Public page that comensales see when scanning a QR.
 * Route: /m/:slug
 *
 * This is the heart of Tablia: the enhanced menu experience.
 * TODO: Fetch real menu data from Supabase by slug
 * TODO: Implement AI chat sidebar
 * TODO: Track analytics events
 */
export function MenuView() {
  const { slug } = useParams();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className='menu-view'>
      {/* Header */}
      <header className='menu-view__header'>
        <div className='menu-view__brand'>
          <UtensilsCrossed size={20} />
          <span>Tablia</span>
        </div>
      </header>

      {/* Menu content placeholder */}
      <main className='menu-view__content'>
        <div className='menu-view__placeholder'>
          <UtensilsCrossed size={48} />
          <h1>Menú</h1>
          <p>
            Cargando menú para <strong>{slug}</strong>...
          </p>
          <p className='menu-view__hint'>
            Este es el placeholder del menú público. Se reemplazará con el
            contenido real cuando se implemente el adapter.
          </p>
        </div>
      </main>

      {/* Chat FAB */}
      <button
        className={`menu-view__chat-fab ${chatOpen ? 'menu-view__chat-fab--active' : ''}`}
        onClick={() => setChatOpen(!chatOpen)}
        aria-label='Abrir chat con el menú'
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat panel placeholder */}
      {chatOpen && (
        <div className='menu-view__chat-panel'>
          <div className='menu-view__chat-header'>
            <h3>Preguntale al menú</h3>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className='menu-view__chat-body'>
            <p className='menu-view__chat-welcome'>
              ¡Hola! Soy el asistente del menú. Preguntame lo que quieras:
              alergenos, recomendaciones, porciones...
            </p>
          </div>
          <div className='menu-view__chat-input'>
            <input type='text' placeholder='Ej: ¿Qué tienen sin gluten?' />
            <button>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
}

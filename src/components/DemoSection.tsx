import { useState } from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { MenuChat } from './MenuChat';
import {
  DEMO_CATEGORIES,
  DEMO_VENUE_NAME,
  DEMO_VENUE_SLUG,
} from '../data/demo-data';
import { useNavigate } from 'react-router-dom';
import './DemoSection.css';

type DemoTab = 'menu' | 'chat';

function formatPrice(price: number, currency: string): string {
  const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
  return `${symbol}${price.toLocaleString('es-AR')}`;
}

function MenuPanel() {
  return (
    <div className='demo-menu'>
      <div className='demo-menu__header'>
        <UtensilsCrossed size={18} />
        <span className='demo-menu__venue'>{DEMO_VENUE_NAME}</span>
        <span className='demo-menu__badge'>Menú digital</span>
      </div>
      <div className='demo-menu__categories'>
        {DEMO_CATEGORIES.map((cat) => (
          <div key={cat.id} className='demo-menu__category'>
            <h4 className='demo-menu__cat-name'>{cat.name}</h4>
            <div className='demo-menu__items'>
              {cat.items.map((item) => (
                <div key={item.id} className='demo-menu__item'>
                  <div className='demo-menu__item-info'>
                    <span className='demo-menu__item-name'>{item.name}</span>
                    {item.description && (
                      <span className='demo-menu__item-desc'>
                        {item.description}
                      </span>
                    )}
                    {item.tags.length > 0 && (
                      <div className='demo-menu__tags'>
                        {item.tags.map((tag) => (
                          <span key={tag} className='demo-menu__tag'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className='demo-menu__price'>
                    {formatPrice(item.price, item.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>('menu');
  const [chatStarted, setChatStarted] = useState(false);
  const navigate = useNavigate();

  const handleChatOpen = () => {
    setChatStarted(true);
    setActiveTab('chat');
  };

  return (
    <section className='demo-section'>
      <div className='demo-section__header'>
        <div className='demo-section__label'>
          <Sparkles size={16} />
          <span>Demo en vivo</span>
        </div>
        <h2 className='demo-section__title'>Probalo ahora — sin registrarte</h2>
        <p className='demo-section__subtitle'>
          Este es el menú de <strong>El Rancho</strong>, una parrilla de
          ejemplo. Abrí el chat y preguntale lo que quieras.
        </p>
      </div>

      {/* Mobile tabs */}
      <div className='demo-section__tabs'>
        <button
          className={`demo-section__tab ${activeTab === 'menu' ? 'demo-section__tab--active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          <UtensilsCrossed size={16} />
          Menú
        </button>
        <button
          className={`demo-section__tab ${activeTab === 'chat' ? 'demo-section__tab--active' : ''}`}
          onClick={handleChatOpen}
        >
          <MessageCircle size={16} />
          Chat IA
          {!chatStarted && <span className='demo-section__tab-pulse' />}
        </button>
      </div>

      {/* Split screen */}
      <div className='demo-section__split'>
        {/* Left: Menu */}
        <div
          className={`demo-section__pane demo-section__pane--menu ${activeTab === 'menu' ? 'demo-section__pane--visible' : ''}`}
        >
          <MenuPanel />
        </div>

        {/* Right: Chat */}
        <div
          className={`demo-section__pane demo-section__pane--chat ${activeTab === 'chat' ? 'demo-section__pane--visible' : ''}`}
        >
          {chatStarted ? (
            <MenuChat
              venueSlug={DEMO_VENUE_SLUG}
              venueName={DEMO_VENUE_NAME}
              categories={DEMO_CATEGORIES}
              onClose={() => setActiveTab('menu')}
              isDemo
            />
          ) : (
            <div className='demo-chat-placeholder'>
              <div className='demo-chat-placeholder__icon'>
                <MessageCircle size={40} />
              </div>
              <p>¿Tenés alguna duda sobre el menú?</p>
              <p className='demo-chat-placeholder__hint'>
                Alérgenos, recomendaciones, porciones, maridajes...
              </p>
              <button
                className='demo-chat-placeholder__btn'
                onClick={handleChatOpen}
              >
                <Sparkles size={18} />
                Abrir chat de IA
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CTA after engaging */}
      <div className='demo-section__cta-block'>
        <p className='demo-section__cta-text'>
          ¿Querés esto para tu restaurante?
        </p>
        <button
          className='demo-section__cta-btn'
          onClick={() => navigate('/login')}
        >
          Empezá gratis — es tuyo en 5 minutos
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

import { useParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { lazy, Suspense, useState, useEffect } from 'react';
import type { MenuCategory, MenuItem } from '../types';
import { analytics } from '../services/analytics';
import './MenuView.css';

// Lazy-load chat — Gemini SDK only downloads when user opens chat
const MenuChat = lazy(() =>
  import('../components/MenuChat').then((m) => ({ default: m.MenuChat })),
);

interface MenuData {
  venue: {
    name: string;
    slug: string;
    cuisine_type: string | null;
    logo_url: string | null;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
}

/**
 * MenuView — Public page that comensales see when scanning a QR.
 * Route: /m/:slug
 */
export function MenuView() {
  const { slug } = useParams();
  const [chatOpen, setChatOpen] = useState(false);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        const { getPublishedMenu } = await import('../services/menu-service');
        const data = await getPublishedMenu(slug);
        setMenuData(data);
        if (data) {
          // Only expand first category by default — less DOM for slow connections
          setExpandedCats(
            new Set(data.categories.length > 0 ? [data.categories[0].id] : []),
          );

          // Track menu page view
          // PostHog auto-captures: timestamp, device, browser, OS, city (GeoIP)
          analytics.track('menu_viewed', {
            slug,
            venue_name: data.venue.name,
          });
        }
      } catch {
        // Silently fail — will show "not found" state
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(catId);
      if (isExpanding) {
        next.add(catId);
        // Track category expansion
        const cat = menuData?.categories.find((c) => c.id === catId);
        analytics.track('category_expanded', {
          slug,
          category_name: cat?.name,
          venue_name: menuData?.venue.name,
        });
      } else {
        next.delete(catId);
      }
      return next;
    });
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return '';
    const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${price.toLocaleString('es-AR')}`;
  };

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='menu-view'>
        <div className='menu-view__loading'>
          <div className='loading-spinner' />
        </div>
      </div>
    );
  }

  // ─── Not Found ────────────────────────────────────────────────

  if (!menuData) {
    return (
      <div className='menu-view'>
        <header className='menu-view__header'>
          <div className='menu-view__brand'>
            <UtensilsCrossed size={20} />
            <span>Tablia</span>
          </div>
        </header>
        <main className='menu-view__content'>
          <div className='menu-view__placeholder'>
            <UtensilsCrossed size={48} />
            <h1>Menú no encontrado</h1>
            <p>
              No hay un menú publicado para <strong>{slug}</strong>.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ─── Menu ─────────────────────────────────────────────────────

  return (
    <div className='menu-view'>
      {/* Header */}
      <header className='menu-view__header'>
        <div className='menu-view__venue-info'>
          <h1 className='menu-view__venue-name'>{menuData.venue.name}</h1>
          {menuData.venue.cuisine_type && (
            <span className='menu-view__cuisine'>
              {menuData.venue.cuisine_type}
            </span>
          )}
        </div>
        <div className='menu-view__brand'>
          <UtensilsCrossed size={14} />
          <span>Tablia</span>
        </div>
      </header>

      {/* Menu Content */}
      <main className='menu-view__content'>
        {menuData.categories.map((cat) => (
          <section key={cat.id} className='menu-view__section'>
            <button
              className='menu-view__section-header'
              onClick={() => toggleCategory(cat.id)}
            >
              <h2>{cat.name}</h2>
              <span className='menu-view__section-count'>
                {cat.items.length}
              </span>
              {expandedCats.has(cat.id) ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>

            {expandedCats.has(cat.id) && (
              <div className='menu-view__items'>
                {cat.items.map((item) => (
                  <div key={item.id} className='menu-view__item'>
                    <div className='menu-view__item-info'>
                      <h3 className='menu-view__item-name'>{item.name}</h3>
                      {item.description && (
                        <p className='menu-view__item-desc'>
                          {item.description}
                        </p>
                      )}
                      {item.tags.length > 0 && (
                        <div className='menu-view__item-tags'>
                          {item.tags.map((tag) => (
                            <span key={tag} className='menu-view__item-tag'>
                              <Tag size={10} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {item.price > 0 && (
                      <span className='menu-view__item-price'>
                        {formatPrice(item.price, item.currency)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {menuData.categories.length === 0 && (
          <div className='menu-view__placeholder'>
            <p>Este menú no tiene platos cargados todavía.</p>
          </div>
        )}
      </main>

      {/* Powered by */}
      <footer className='menu-view__footer'>
        <UtensilsCrossed size={12} />
        <span>Potenciado por Tablia</span>
      </footer>

      {/* Chat FAB */}
      <button
        className={`menu-view__chat-fab ${chatOpen ? 'menu-view__chat-fab--active' : ''}`}
        onClick={() => {
          const opening = !chatOpen;
          setChatOpen(opening);
          if (opening) {
            analytics.track('chat_opened', {
              slug,
              venue_name: menuData?.venue.name,
            });
          }
        }}
        aria-label='Abrir chat con el menú'
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat panel (lazy-loaded with Gemini SDK) */}
      {chatOpen && (
        <Suspense
          fallback={
            <div style={{ position: 'fixed', bottom: '5.5rem', right: '1rem' }}>
              <div className='loading-spinner' />
            </div>
          }
        >
          <MenuChat
            venueSlug={menuData.venue.slug}
            venueName={menuData.venue.name}
            categories={menuData.categories}
            onClose={() => setChatOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

import { useParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react';
import { lazy, Suspense, useState, useEffect } from 'react';
import type {
  ChatPersona,
  CustomerMemorySummary,
  MenuCategory,
  MenuItem,
  ParsedMenuCharge,
  ParsedMenuVisualStyle,
} from '../types';
import { analytics } from '../services/analytics';
import { DemoBanner } from '../components/DemoBanner';
import {
  getMenuVisualStyleProperties,
  resolveMenuVisualTheme,
} from '../services/menu-visual-style';
import { getCustomerMemoryMessage } from '../services/customer-memory-copy';
import './MenuView.css';

const DEMO_SLUG = 'seed-parrilla-dev';
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'seed@tablia.dev';

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
    chat_persona?: ChatPersona;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
  visualStyle?: ParsedMenuVisualStyle;
  additionalCharges?: ParsedMenuCharge[];
  legalNotes?: string[];
}

/**
 * MenuView — Public page that comensales see when scanning a QR.
 * Can be rendered from VenueLanding (with prefetched data) or directly via URL.
 */

interface MenuViewProps {
  prefetchedData?: MenuData | null;
  customerMemory?: CustomerMemorySummary | null;
  slug?: string;
  onBack?: () => void;
}

const QUICK_PROMPTS = [
  'Armame una recomendación',
  'Algo para compartir',
  'Sin TACC',
  'Postre ideal',
];

function splitVariantName(name: string): { baseName: string; variant?: string } {
  const match = name.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (!match) return { baseName: name };
  return { baseName: match[1].trim(), variant: match[2].trim() };
}

function getGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Buen día';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function MenuView({
  prefetchedData,
  customerMemory,
  slug: slugProp,
  onBack,
}: MenuViewProps = {}) {
  const params = useParams();
  const slug = slugProp || params.slug;
  const [chatOpen, setChatOpen] = useState(false);
  const [menuData, setMenuData] = useState<MenuData | null>(
    prefetchedData ?? null,
  );
  const [loading, setLoading] = useState(!prefetchedData);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [assistantInput, setAssistantInput] = useState('');
  const [initialChatPrompt, setInitialChatPrompt] = useState('');

  useEffect(() => {
    // If we already have prefetched data, just set up the initial expanded category
    if (prefetchedData) {
      setExpandedCats(
        new Set(
          prefetchedData.categories.length > 0
            ? [prefetchedData.categories[0].id]
            : [],
        ),
      );
      analytics.track('menu_viewed', {
        slug,
        venue_name: prefetchedData.venue.name,
        prefetched: true,
      });
      return;
    }

    // Otherwise fetch from scratch (direct URL access)
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
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const openChatWithPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    setInitialChatPrompt(trimmed);
    setChatOpen(true);
    setAssistantInput('');
    analytics.track('assistant_prompt_submitted', {
      slug,
      venue_name: menuData?.venue.name,
      prompt_length: trimmed.length,
      prompt_source: 'quick_prompt',
    });
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

  const isDemo = slug === DEMO_SLUG;
  const visualTheme = resolveMenuVisualTheme(
    menuData.visualStyle,
    menuData.venue.cuisine_type,
  );
  const visualStyle = getMenuVisualStyleProperties(visualTheme);
  const rootClassName = [
    'menu-view',
    `menu-view--template-${visualTheme.template}`,
    `menu-view--density-${visualTheme.density}`,
    `menu-view--decor-${visualTheme.decorativeStyle}`,
    `menu-view--price-${visualTheme.priceStyle}`,
    `menu-view--heading-${visualTheme.headingStyle}`,
  ].join(' ');
  const hasMenuNotes =
    (menuData.additionalCharges?.length ?? 0) > 0 ||
    (menuData.legalNotes?.length ?? 0) > 0;
  const memoryMessage = getCustomerMemoryMessage(customerMemory);

  return (
    <div className={rootClassName} style={visualStyle}>
      {/* Demo banner — only shown for the seed demo menu */}
      {isDemo && <DemoBanner userEmail={DEMO_EMAIL} />}
      {/* Header */}
      <header className='menu-view__header'>
        {onBack && (
          <button
            className='menu-view__back'
            onClick={onBack}
            aria-label='Volver a la landing'
          >
            <ArrowLeft size={20} />
          </button>
        )}
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
        <section className='menu-view__assistant-card'>
          {memoryMessage && (
            <div className='menu-view__memory-card'>
              <span>{memoryMessage.title}</span>
              <p>{memoryMessage.body}</p>
              {memoryMessage.meta && <small>{memoryMessage.meta}</small>}
            </div>
          )}

          <div className='menu-view__assistant-copy'>
            <Sparkles size={16} />
            <div>
              <p>
                {getGreeting()}, ¿querés que te ayude a elegir en{' '}
                <strong>{menuData.venue.name}</strong>?
              </p>
              <span>Preguntá por gustos, alergias, porciones o maridajes.</span>
            </div>
          </div>
          <form
            className='menu-view__assistant-form'
            onSubmit={(event) => {
              event.preventDefault();
              openChatWithPrompt(assistantInput);
            }}
          >
            <input
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder='Ej: somos 2, queremos compartir algo liviano'
            />
            <button type='submit' aria-label='Preguntar al menú'>
              <Send size={16} />
            </button>
          </form>
          <div className='menu-view__assistant-prompts'>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type='button'
                onClick={() => openChatWithPrompt(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

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
                {cat.items.map((item) => {
                  const { baseName, variant } = splitVariantName(item.name);

                  return (
                    <div key={item.id} className='menu-view__item'>
                      <div className='menu-view__item-info'>
                        <>
                          <h3 className='menu-view__item-name'>
                            {baseName}
                          </h3>
                          {variant && (
                            <p className='menu-view__item-variant'>
                              {variant}
                            </p>
                          )}
                        </>
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
                  );
                })}
              </div>
            )}
          </section>
        ))}

        {menuData.categories.length === 0 && (
          <div className='menu-view__placeholder'>
            <p>Este menú no tiene platos cargados todavía.</p>
          </div>
        )}

        {hasMenuNotes && (
          <section className='menu-view__menu-notes'>
            {menuData.additionalCharges?.map((charge) => (
              <div key={charge.label} className='menu-view__charge'>
                <span>{charge.label}</span>
                <strong>{formatPrice(charge.price, charge.currency)}</strong>
                {charge.description && <p>{charge.description}</p>}
              </div>
            ))}
            {menuData.legalNotes?.map((note) => (
              <p key={note} className='menu-view__legal-note'>
                {note}
              </p>
            ))}
          </section>
        )}
      </main>

      {/* Powered by */}
      <footer className='menu-view__footer'>
        <UtensilsCrossed size={12} />
        <span>Potenciado por Tablia</span>
      </footer>

      {/* Chat FAB */}
      {!chatOpen && (
        <button
          className='menu-view__chat-fab'
          onClick={() => {
            setChatOpen(true);
            analytics.track('chat_opened', {
              slug,
              venue_name: menuData?.venue.name,
            });
          }}
          aria-label='Abrir chat con el menú'
        >
          <MessageCircle size={24} aria-hidden='true' />
        </button>
      )}

      {/* Chat panel (lazy-loaded with Gemini SDK) */}
      {chatOpen && (
        <>
          <button
            className='menu-view__chat-backdrop'
            onClick={() => setChatOpen(false)}
            aria-label='Cerrar chat'
          />
          <Suspense
            fallback={
              <div
                style={{
                  position: 'fixed',
                  bottom: '5.5rem',
                  right: '1rem',
                  zIndex: 121,
                }}
              >
                <div className='loading-spinner' />
              </div>
            }
          >
            <MenuChat
              venueSlug={menuData.venue.slug}
              venueName={menuData.venue.name}
              categories={menuData.categories}
              initialPrompt={initialChatPrompt}
              chatPersona={menuData.venue.chat_persona}
              onClose={() => setChatOpen(false)}
            />
          </Suspense>
        </>
      )}
    </div>
  );
}

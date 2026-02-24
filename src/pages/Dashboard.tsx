import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { MenuImport } from '../components/MenuImport';
import { MenuReview } from '../components/MenuReview';
import { QrModal } from '../components/QrModal';
import {
  Plus,
  LogOut,
  UtensilsCrossed,
  QrCode,
  Eye,
  Pencil,
  Trash2,
  Store,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  MessageCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Clock,
  FileSearch,
} from 'lucide-react';
import type { Venue, Menu, MenuStatus, ParsedMenu } from '../types';
import './Dashboard.css';

// ─── Mock Analytics Data ────────────────────────────────────────

const MOCK_STATS = {
  scansToday: 47,
  scansWeek: 312,
  scansTotal: 1842,
  todayTrend: +12, // percent vs yesterday
  weekTrend: +8,
};

const MOCK_DAILY_SCANS = [
  { day: 'Lun', value: 32 },
  { day: 'Mar', value: 28 },
  { day: 'Mié', value: 45 },
  { day: 'Jue', value: 38 },
  { day: 'Vie', value: 62 },
  { day: 'Sáb', value: 78 },
  { day: 'Dom', value: 47 },
];

const MOCK_TOP_ITEMS = [
  {
    name: 'Hamburguesa Clásica',
    category: 'Principales',
    views: 520,
    price: 8500,
  },
  { name: 'Gin Tonic de Autor', category: 'Bebidas', views: 450, price: 6200 },
  { name: 'Ravioles de Calabaza', category: 'Pastas', views: 380, price: 7800 },
  { name: 'Tiramisú Casero', category: 'Postres', views: 310, price: 4500 },
  { name: 'Ensalada César', category: 'Entradas', views: 250, price: 5200 },
];

const MOCK_CONVERSATIONS = [
  { question: '¿Tienen opciones sin TACC?', count: 125 },
  { question: '¿Cuál es el horario de atención?', count: 98 },
  { question: '¿Aceptan reservas para grupos grandes?', count: 76 },
  { question: '¿Tienen menú infantil?', count: 54 },
];

// ─── Mini Bar Chart Component ───────────────────────────────────

function MiniBarChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className='dash-chart'>
      <div className='dash-chart__bars'>
        {data.map((d, i) => (
          <div key={i} className='dash-chart__col'>
            <div className='dash-chart__bar-wrap'>
              <div
                className='dash-chart__bar'
                style={{ height: `${(d.value / max) * 100}%` }}
              >
                <span className='dash-chart__tooltip'>{d.value}</span>
              </div>
            </div>
            <span className='dash-chart__label'>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard Views ────────────────────────────────────────────

type DashboardView =
  | 'loading'
  | 'create-venue'
  | 'venue'
  | 'import-menu'
  | 'edit-menu';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<DashboardView>('loading');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [venueName, setVenueName] = useState('');
  const [venueSlug, setVenueSlug] = useState('');
  const [venueError, setVenueError] = useState<string | null>(null);
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingParsedMenu, setEditingParsedMenu] = useState<ParsedMenu | null>(
    null,
  );
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const activeMenu = menus[0] ?? null; // first menu (most recent)
  const isPublished = activeMenu?.status === 'published';
  const publicOrigin =
    import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const menuUrl = venue ? `${publicOrigin}/m/${venue.slug}` : '';

  const STATUS_LABELS: Record<MenuStatus, { label: string; color: string }> = {
    draft: { label: 'Borrador', color: 'var(--text-muted)' },
    parsing: { label: 'Procesando...', color: 'var(--accent)' },
    review: { label: 'En revisión', color: '#e67e22' },
    published: { label: 'Publicado', color: 'var(--success)' },
  };

  const loadVenues = useCallback(async () => {
    try {
      const { getMyVenues } = await import('../services/venue-service');
      const venues = await getMyVenues();
      if (venues.length > 0) {
        setVenue(venues[0]);
        const { getMenusByVenue } = await import('../services/menu-service');
        const venueMenus = await getMenusByVenue(venues[0].id);
        setMenus(venueMenus);
        setView('venue');
      } else {
        setView('create-venue');
      }
    } catch {
      setView('create-venue');
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreateVenue = async () => {
    if (!venueName.trim()) return;
    setVenueError(null);
    setCreatingVenue(true);

    const slug =
      venueSlug.trim() ||
      venueName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    try {
      const { createVenue } = await import('../services/venue-service');
      const newVenue = await createVenue({
        name: venueName.trim(),
        slug,
      });
      setVenue(newVenue);
      setMenus([]);
      setView('venue');
    } catch (err) {
      setVenueError(
        err instanceof Error
          ? err.message
          : 'Error al crear el establecimiento',
      );
    } finally {
      setCreatingVenue(false);
    }
  };

  const handleMenuCreated = async () => {
    if (venue) {
      const { getMenusByVenue } = await import('../services/menu-service');
      const venueMenus = await getMenusByVenue(venue.id);
      setMenus(venueMenus);
    }
    setView('venue');
  };

  /** Resume reviewing a menu that's in 'review' status (has parsed_json). */
  const handleResumeReview = async (menuId: string) => {
    setEditLoading(true);
    setEditError(null);
    setEditingMenuId(menuId);
    setView('edit-menu');

    try {
      // Menu in 'review' has parsed_json stored — load it as ParsedMenu
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('tablia_menus')
        .select('parsed_json')
        .eq('id', menuId)
        .single();

      if (error) throw new Error(error.message);
      if (data?.parsed_json) {
        setEditingParsedMenu(data.parsed_json as unknown as ParsedMenu);
      } else {
        throw new Error('No se encontraron datos del menú parseado.');
      }
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Error al cargar el menú',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditMenu = async (menuId: string) => {
    setEditLoading(true);
    setEditError(null);
    setEditingMenuId(menuId);
    setView('edit-menu');

    try {
      const { getMenuForEdit } = await import('../services/menu-service');
      const parsed = await getMenuForEdit(menuId);
      setEditingParsedMenu(parsed);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Error al cargar el menú',
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditConfirm = async (editedMenu: ParsedMenu) => {
    if (!editingMenuId) return;
    setEditError(null);

    try {
      const { confirmParsedMenu } = await import('../services/menu-service');
      await confirmParsedMenu(editingMenuId, editedMenu);
      await handleMenuCreated();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Error al guardar cambios',
      );
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que querés eliminar este menú? Esta acción no se puede deshacer.',
      )
    )
      return;

    try {
      const { deleteMenu } = await import('../services/menu-service');
      await deleteMenu(menuId);
      await handleMenuCreated();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el menú');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNameChange = (name: string) => {
    setVenueName(name);
    setVenueSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className='dashboard'>
      {/* Header */}
      <header className='dashboard__header'>
        <div className='dashboard__logo'>
          <UtensilsCrossed size={24} />
          <span>Tablia</span>
        </div>
        <div className='dashboard__user'>
          <span className='dashboard__email'>{user?.email}</span>
          <button className='dashboard__signout' onClick={handleSignOut}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className='dashboard__main'>
        {/* Loading */}
        {view === 'loading' && (
          <div className='dashboard__loading'>
            <div className='loading-spinner' />
          </div>
        )}

        {/* Create Venue */}
        {view === 'create-venue' && (
          <div className='dashboard__create-venue'>
            <div className='dashboard__empty-icon'>
              <Store size={48} />
            </div>
            <h2>Creá tu establecimiento</h2>
            <p>Ingresá el nombre de tu restaurante o bar para empezar.</p>

            <div className='dashboard__venue-form'>
              <input
                className='dashboard__venue-input'
                placeholder='Nombre del establecimiento'
                value={venueName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <div className='dashboard__slug-preview'>
                tablia.io/m/<strong>{venueSlug || '...'}</strong>
              </div>

              {venueError && (
                <div className='dashboard__venue-error'>{venueError}</div>
              )}

              <button
                className='dashboard__add-btn dashboard__add-btn--large'
                onClick={handleCreateVenue}
                disabled={!venueName.trim() || creatingVenue}
              >
                {creatingVenue ? 'Creando...' : 'Crear establecimiento'}
              </button>
            </div>
          </div>
        )}

        {/* ═══ VENUE DASHBOARD ═══════════════════════════════════ */}
        {view === 'venue' && venue && (
          <>
            {/* ─── Hero: Venue + Menu Status ──────────────────── */}
            <section className='dash-hero'>
              <div className='dash-hero__info'>
                <h1 className='dash-hero__name'>{venue.name}</h1>
                {isPublished && (
                  <div className='dash-hero__link-row'>
                    <a
                      href={menuUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='dash-hero__url'
                    >
                      tablia.io/m/{venue.slug}
                      <ExternalLink size={13} />
                    </a>
                    <button
                      className='dash-hero__copy'
                      onClick={handleCopyLink}
                      title='Copiar link'
                    >
                      <Copy size={14} />
                      {linkCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                )}

                {/* Status badge for non-published menus */}
                {activeMenu && !isPublished && (
                  <div
                    className='dash-hero__status-badge'
                    style={{ color: STATUS_LABELS[activeMenu.status].color }}
                  >
                    {activeMenu.status === 'parsing' ? (
                      <Clock size={14} />
                    ) : (
                      <FileSearch size={14} />
                    )}
                    {STATUS_LABELS[activeMenu.status].label}
                  </div>
                )}
              </div>

              <div className='dash-hero__actions'>
                {activeMenu ? (
                  <>
                    {/* Review: show resume button */}
                    {activeMenu.status === 'review' && (
                      <button
                        className='dash-hero__btn dash-hero__btn--primary'
                        onClick={() => handleResumeReview(activeMenu.id)}
                      >
                        <FileSearch size={16} />
                        Revisar menú
                      </button>
                    )}

                    {/* Parsing: show waiting state */}
                    {activeMenu.status === 'parsing' && (
                      <button
                        className='dash-hero__btn dash-hero__btn--outline'
                        disabled
                      >
                        <Loader2 size={16} className='menu-import__spin' />
                        Procesando...
                      </button>
                    )}

                    {/* Published: full actions */}
                    {isPublished && (
                      <>
                        <a
                          href={menuUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='dash-hero__btn dash-hero__btn--outline'
                        >
                          <Eye size={16} />
                          Ver menú
                        </a>
                        <button
                          className='dash-hero__btn dash-hero__btn--outline'
                          onClick={() => setShowQr(true)}
                        >
                          <QrCode size={16} />
                          QR
                        </button>
                        <button
                          className='dash-hero__btn dash-hero__btn--outline'
                          onClick={() => handleEditMenu(activeMenu.id)}
                        >
                          <Pencil size={16} />
                          Editar
                        </button>
                      </>
                    )}

                    {/* Delete always available */}
                    <button
                      className='dash-hero__btn dash-hero__btn--danger'
                      onClick={() => handleDeleteMenu(activeMenu.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    className='dash-hero__btn dash-hero__btn--primary'
                    onClick={() => setView('import-menu')}
                  >
                    <Plus size={18} />
                    Importar menú
                  </button>
                )}
              </div>
            </section>

            {/* Show analytics only if menu exists */}
            {isPublished ? (
              <>
                {/* ─── Stats Cards ────────────────────────────── */}
                <section className='dash-stats'>
                  <div className='dash-stat-card'>
                    <div className='dash-stat-card__header'>
                      <span className='dash-stat-card__label'>
                        Escaneos hoy
                      </span>
                      <span className='dash-stat-card__trend dash-stat-card__trend--up'>
                        +{MOCK_STATS.todayTrend}%
                      </span>
                    </div>
                    <div className='dash-stat-card__value'>
                      {MOCK_STATS.scansToday}
                    </div>
                    <div className='dash-stat-card__sub'>vs ayer</div>
                  </div>
                  <div className='dash-stat-card'>
                    <div className='dash-stat-card__header'>
                      <span className='dash-stat-card__label'>Esta semana</span>
                      <span className='dash-stat-card__trend dash-stat-card__trend--up'>
                        +{MOCK_STATS.weekTrend}%
                      </span>
                    </div>
                    <div className='dash-stat-card__value'>
                      {MOCK_STATS.scansWeek}
                    </div>
                    <div className='dash-stat-card__sub'>últimos 7 días</div>
                  </div>
                  <div className='dash-stat-card'>
                    <div className='dash-stat-card__header'>
                      <span className='dash-stat-card__label'>
                        Total histórico
                      </span>
                      <Users size={16} className='dash-stat-card__icon' />
                    </div>
                    <div className='dash-stat-card__value'>
                      {MOCK_STATS.scansTotal.toLocaleString()}
                    </div>
                    <div className='dash-stat-card__sub'>desde la creación</div>
                  </div>
                </section>

                {/* ─── Charts Row ────────────────────────────── */}
                <section className='dash-grid'>
                  {/* Bar chart */}
                  <div className='dash-card'>
                    <div className='dash-card__header'>
                      <h3>
                        <TrendingUp size={18} />
                        Escaneos últimos 7 días
                      </h3>
                    </div>
                    <MiniBarChart data={MOCK_DAILY_SCANS} />
                  </div>

                  {/* Top Items */}
                  <div className='dash-card'>
                    <div className='dash-card__header'>
                      <h3>
                        <UtensilsCrossed size={18} />
                        Items más vistos
                      </h3>
                    </div>
                    <div className='dash-leaderboard'>
                      {MOCK_TOP_ITEMS.map((item, idx) => {
                        const maxViews = MOCK_TOP_ITEMS[0].views;
                        return (
                          <div key={idx} className='dash-leader-row'>
                            <span className='dash-leader-row__rank'>
                              {idx + 1}
                            </span>
                            <div className='dash-leader-row__info'>
                              <span className='dash-leader-row__name'>
                                {item.name}
                              </span>
                              <span className='dash-leader-row__cat'>
                                {item.category}
                              </span>
                            </div>
                            <div className='dash-leader-row__bar-wrap'>
                              <div
                                className='dash-leader-row__bar'
                                style={{
                                  width: `${(item.views / maxViews) * 100}%`,
                                }}
                              />
                            </div>
                            <span className='dash-leader-row__views'>
                              {item.views}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* ─── Conversations ─────────────────────────── */}
                <section className='dash-card dash-card--full'>
                  <div className='dash-card__header'>
                    <h3>
                      <MessageCircle size={18} />
                      Conversaciones recurrentes
                    </h3>
                  </div>
                  <div className='dash-conversations'>
                    {MOCK_CONVERSATIONS.map((conv, idx) => (
                      <div key={idx} className='dash-conv-row'>
                        <MessageCircle
                          size={16}
                          className='dash-conv-row__icon'
                        />
                        <span className='dash-conv-row__question'>
                          {conv.question}
                        </span>
                        <span className='dash-conv-row__count'>
                          {conv.count} veces
                        </span>
                        <ChevronRight
                          size={16}
                          className='dash-conv-row__arrow'
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : !activeMenu ? (
              /* Empty state when no menu at all */
              <div className='dashboard__empty'>
                <div className='dashboard__empty-icon'>
                  <QrCode size={48} />
                </div>
                <h2>Importá tu primer menú</h2>
                <p>
                  Subí un PDF, foto, o pegá el texto de tu menú. Tablia lo
                  parsea automáticamente con IA.
                </p>
                <button
                  className='dashboard__add-btn dashboard__add-btn--large'
                  onClick={() => setView('import-menu')}
                >
                  <Plus size={20} />
                  Importar menú
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Import Menu */}
        {view === 'import-menu' && venue && (
          <MenuImport
            venueId={venue.id}
            venueSlug={venue.slug}
            onMenuCreated={handleMenuCreated}
            onCancel={() => setView('venue')}
          />
        )}

        {/* Edit Menu */}
        {view === 'edit-menu' && (
          <div className='menu-import'>
            <div className='menu-import__header'>
              <button
                className='menu-import__back'
                onClick={() => setView('venue')}
              >
                <ArrowLeft size={20} />
              </button>
              <h2>Editar menú</h2>
            </div>

            {editLoading && (
              <div className='menu-import__body menu-import__body--center'>
                <Loader2 size={40} className='menu-import__spin' />
                <h3>Cargando menú...</h3>
              </div>
            )}

            {editError && <div className='menu-import__error'>{editError}</div>}

            {!editLoading && editingParsedMenu && (
              <MenuReview
                parsedMenu={editingParsedMenu}
                onConfirm={handleEditConfirm}
                confirmLabel='Guardar cambios'
              />
            )}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQr && venue && (
        <QrModal
          url={menuUrl}
          venueName={venue.name}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}

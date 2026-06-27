import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MenuImport } from '../components/MenuImport';
import { MenuReview } from '../components/MenuReview';
import { QrModal } from '../components/QrModal';
import { DemoBanner } from '../components/DemoBanner';
import { DashboardAnalyticsPanel } from '../components/DashboardAnalyticsPanel';
import { LandingLinksEditor } from '../components/LandingLinksEditor';
import { ChatPersonaEditor } from '../components/ChatPersonaEditor';
import { EngagementEditor } from '../components/EngagementEditor';
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
  Copy,
  ExternalLink,
  Clock,
  FileSearch,
} from 'lucide-react';
import type { ChatSession, Venue, Menu, MenuStatus, ParsedMenu } from '../types';
import './Dashboard.css';

import {
  getVenueAnalytics,
  type DashboardAnalytics,
} from '../services/posthog-service';
import {
  captureOwnerError,
  trackOwnerEvent,
} from '../services/owner-analytics';

import {
  MainDashboardSkeleton,
  StatsDashboardSkeleton,
} from '../components/DashboardSkeleton';

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

  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const dashboardViewTracked = useRef<string | null>(null);
  const analyticsViewTracked = useRef<string | null>(null);

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

  useEffect(() => {
    if (view !== 'venue' || !venue) return;
    if (dashboardViewTracked.current === venue.slug) return;
    dashboardViewTracked.current = venue.slug;
    trackOwnerEvent('owner_dashboard_viewed', {
      slug: venue.slug,
      menu_status: activeMenu?.status ?? 'none',
    });
  }, [view, venue?.slug, activeMenu?.status]);

  // Load analytics when a published menu is active.
  // Note: only show loading skeleton when there is no prior data.
  // This avoids the flash (StrictMode runs effects twice; on the 2nd run we
  // already have stale data to display so we should not re-show the skeleton).
  useEffect(() => {
    if (venue && isPublished) {
      setAnalyticsLoading((prev) => {
        // Keep loading state only if there's no data yet
        if (!analyticsData) return true;
        return prev;
      });

      const onCached = (cachedData: DashboardAnalytics) => {
        setAnalyticsData(cachedData);
        setAnalyticsLoading(false);
      };

      getVenueAnalytics(venue.slug, venue.name, onCached)
        .then((freshData) => {
          setAnalyticsData(freshData);
          if (analyticsViewTracked.current !== venue.slug) {
            analyticsViewTracked.current = venue.slug;
            trackOwnerEvent('owner_analytics_viewed', {
              slug: venue.slug,
              menu_status: activeMenu?.status ?? 'published',
            });
          }
        })
        .catch(() => {
          // Keep existing data if fetch fails
        })
        .finally(() => setAnalyticsLoading(false));
    } else {
      setAnalyticsData(null);
      setAnalyticsLoading(false);
    }
  }, [venue?.slug, venue?.name, isPublished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load real chat sessions from Supabase
  useEffect(() => {
    if (!venue) return;
    import('../services/chat-service')
      .then(({ getChatSessions }) => getChatSessions(venue.id))
      .then(setChatSessions)
      .catch(() => {}); // silently ignore errors
  }, [venue?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cerrar sesión');
    }
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
      trackOwnerEvent('venue_created', {
        slug: newVenue.slug,
      });
    } catch (err) {
      captureOwnerError('venue_create_failed', err, {
        slug,
        workflow: 'venue_create',
      });
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
      const { getStoredParsedMenu } = await import('../services/menu-service');
      setEditingParsedMenu(await getStoredParsedMenu(menuId));
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
      captureOwnerError('menu_publish_failed', err, {
        slug: venue?.slug,
        workflow: 'menu_edit',
      });
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
    trackOwnerEvent('qr_link_copied', {
      slug: venue?.slug,
      source: 'dashboard_public_link',
    });
  };

  const handleOpenQr = () => {
    setShowQr(true);
    trackOwnerEvent('qr_modal_opened', {
      slug: venue?.slug,
    });
  };

  const handleStartMenuImport = () => {
    if (venue) {
      trackOwnerEvent('menu_import_started', {
        slug: venue.slug,
        source: activeMenu ? 'replace_or_edit' : 'empty_state',
        menu_status: activeMenu?.status ?? 'none',
      });
    }
    setView('import-menu');
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
      <DemoBanner userEmail={user?.email} />
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
        {view === 'loading' && <MainDashboardSkeleton />}

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
                          onClick={handleOpenQr}
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
                    onClick={handleStartMenuImport}
                  >
                    <Plus size={18} />
                    Importar menú
                  </button>
                )}
              </div>
            </section>

            {/* ─── Landing Links Editor ────────────────────── */}
            <section className='dash-card dash-card--full' style={{ marginBottom: '1rem' }}>
              <LandingLinksEditor
                venueId={venue.id}
                venueSlug={venue.slug}
                initialLinks={venue.landing_links ?? []}
              />
            </section>

            <section className='dash-card dash-card--full'>
              <ChatPersonaEditor
                venueId={venue.id}
                venueSlug={venue.slug}
                initialPersona={venue.chat_persona}
                onSaved={(chatPersona) =>
                  setVenue((current) =>
                    current
                      ? { ...current, chat_persona: chatPersona }
                      : current,
                  )
                }
              />
            </section>

            <section className='dash-card dash-card--full'>
              <EngagementEditor venueId={venue.id} venueSlug={venue.slug} />
            </section>

            {/* Show analytics only if menu exists */}
            {isPublished ? (
              analyticsLoading || !analyticsData ? (
                <StatsDashboardSkeleton />
              ) : (
                <DashboardAnalyticsPanel
                  analyticsData={analyticsData}
                  chatSessions={chatSessions}
                  expandedSession={expandedSession}
                  onToggleSession={setExpandedSession}
                />
              )
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
                  onClick={handleStartMenuImport}
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

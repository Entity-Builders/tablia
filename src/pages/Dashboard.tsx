import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { MenuImport } from '../components/MenuImport';
import {
  Plus,
  LogOut,
  UtensilsCrossed,
  QrCode,
  Eye,
  Store,
} from 'lucide-react';
import type { Venue, Menu } from '../types';
import './Dashboard.css';

type DashboardView = 'loading' | 'create-venue' | 'venue' | 'import-menu';

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

  const loadVenues = useCallback(async () => {
    try {
      const { getMyVenues } = await import('../services/venue-service');
      const venues = await getMyVenues();
      if (venues.length > 0) {
        setVenue(venues[0]);
        // Load menus for this venue
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

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setVenueName(name);
    setVenueSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

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

      {/* Content */}
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

        {/* Venue Dashboard */}
        {view === 'venue' && venue && (
          <>
            <div className='dashboard__title-row'>
              <div>
                <h1>{venue.name}</h1>
                <span className='dashboard__venue-slug'>
                  tablia.io/m/{venue.slug}
                </span>
              </div>
              <button
                className='dashboard__add-btn'
                onClick={() => setView('import-menu')}
              >
                <Plus size={20} />
                Importar menú
              </button>
            </div>

            {menus.length === 0 ? (
              <div className='dashboard__empty'>
                <div className='dashboard__empty-icon'>
                  <QrCode size={48} />
                </div>
                <h2>Importá tu primer menú</h2>
                <p>
                  Pegá el texto de tu menú actual. Tablia lo parsea
                  automáticamente con IA.
                </p>
                <button
                  className='dashboard__add-btn dashboard__add-btn--large'
                  onClick={() => setView('import-menu')}
                >
                  <Plus size={20} />
                  Importar menú
                </button>
              </div>
            ) : (
              <div className='dashboard__menu-grid'>
                {menus.map((menu) => (
                  <div key={menu.id} className='dashboard__menu-card'>
                    <h3>{menu.name}</h3>
                    <p>Fuente: {menu.source_type}</p>
                    <div className='dashboard__menu-stats'>
                      <span
                        className={`dashboard__status dashboard__status--${menu.status}`}
                      >
                        {menu.status === 'published'
                          ? '🟢 Publicado'
                          : menu.status === 'review'
                            ? '🟡 En revisión'
                            : menu.status === 'parsing'
                              ? '⏳ Procesando'
                              : '📝 Borrador'}
                      </span>
                      {menu.status === 'published' && (
                        <a
                          href={`/m/${venue.slug}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='dashboard__view-link'
                        >
                          <Eye size={14} /> Ver menú
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
      </main>
    </div>
  );
}

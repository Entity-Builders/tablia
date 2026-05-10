import { useParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  Instagram,
  Facebook,
  Globe,
  MapPin,
  Phone,
  Wifi,
  Star,
  Calendar,
  Mail,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { LandingLink, LandingLinkIcon, MenuCategory, MenuItem } from '../types';
import { analytics } from '../services/analytics';
import { DemoBanner } from '../components/DemoBanner';
import { MenuView } from './MenuView';
import './VenueLanding.css';

const DEMO_SLUG = 'seed-parrilla-dev';
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'seed@tablia.dev';

interface VenueLandingData {
  name: string;
  slug: string;
  logo_url: string | null;
  cuisine_type: string | null;
  landing_links: LandingLink[];
}

interface MenuData {
  venue: {
    name: string;
    slug: string;
    cuisine_type: string | null;
    logo_url: string | null;
  };
  categories: (MenuCategory & { items: MenuItem[] })[];
}

// ─── Icon Map ────────────────────────────────────────────────────

const ICON_MAP: Record<LandingLinkIcon, typeof Globe> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Globe, // lucide doesn't have TikTok yet
  twitter: Globe, // using Globe as fallback
  calendar: Calendar,
  star: Star,
  phone: Phone,
  wifi: Wifi,
  globe: Globe,
  'map-pin': MapPin,
  mail: Mail,
  whatsapp: MessageCircle,
};

function getLinkIcon(icon?: LandingLinkIcon) {
  if (!icon) return Globe;
  return ICON_MAP[icon] || Globe;
}

// ─── Default Links (when none configured) ────────────────────────

function getDefaultLinks(): LandingLink[] {
  return [
    { type: 'menu', label: 'Ver Menú 🍔', isPrimary: true },
  ];
}

/**
 * VenueLanding — Public "Linktree" page shown when scanning QR.
 * Route: /m/:slug
 *
 * Renders a lightweight landing with venue logo + configurable links.
 * Prefetches the full menu in background for instant transitions.
 */
export function VenueLanding() {
  const { slug } = useParams();
  const [venueData, setVenueData] = useState<VenueLandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Prefetched menu data — loaded in background while user sees landing
  const prefetchedMenu = useRef<MenuData | null>(null);
  const prefetchStarted = useRef(false);

  // ─── Fetch venue (fast) + prefetch menu (background) ──────────

  useEffect(() => {
    if (!slug) return;

    const loadVenue = async () => {
      try {
        const { getVenueLanding } = await import('../services/venue-service');
        const data = await getVenueLanding(slug);
        setVenueData(data);

        if (data) {
          analytics.track('landing_viewed', {
            slug,
            venue_name: data.name,
            link_count: data.landing_links.length,
          });
        }
      } catch {
        // Silently fail — will show "not found" state
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [slug]);

  // Prefetch menu immediately in background (separate effect to not delay landing render)
  useEffect(() => {
    if (!slug || prefetchStarted.current) return;
    prefetchStarted.current = true;

    const prefetch = async () => {
      try {
        const { getPublishedMenu } = await import('../services/menu-service');
        const data = await getPublishedMenu(slug);
        prefetchedMenu.current = data;
      } catch {
        // Menu prefetch failed — MenuView will fetch on its own
      }
    };

    prefetch();
  }, [slug]);

  // ─── Transition to menu ────────────────────────────────────────

  const handleOpenMenu = useCallback(() => {
    analytics.track('menu_opened_from_landing', {
      slug,
      venue_name: venueData?.name,
    });

    // Animate exit, then swap
    setExiting(true);
    setTimeout(() => setShowMenu(true), 280);
  }, [slug, venueData?.name]);

  // ─── Link click handler ────────────────────────────────────────

  const handleLinkClick = useCallback(
    (link: LandingLink) => {
      analytics.track('landing_link_clicked', {
        slug,
        venue_name: venueData?.name,
        link_type: link.type,
        link_label: link.label,
      });

      if (link.type === 'menu') {
        handleOpenMenu();
        return;
      }

      if (link.type === 'phone' && link.url) {
        window.open(`tel:${link.url}`, '_self');
        return;
      }

      if (link.type === 'whatsapp' && link.url) {
        const waUrl = link.url.startsWith('http')
          ? link.url
          : `https://wa.me/${link.url.replace(/\D/g, '')}`;
        window.open(waUrl, '_blank');
        return;
      }

      if (link.type === 'url' && link.url) {
        window.open(link.url, '_blank', 'noopener,noreferrer');
        return;
      }

      // 'wifi' — no action needed (info displayed inline)
    },
    [slug, venueData?.name, handleOpenMenu],
  );

  // ─── If menu is showing, render MenuView directly ──────────────

  if (showMenu) {
    return <MenuView prefetchedData={prefetchedMenu.current} slug={slug} />;
  }

  // ─── Loading ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='venue-landing'>
        <div className='venue-landing__loading'>
          <div className='loading-spinner' />
        </div>
      </div>
    );
  }

  // ─── Not Found ─────────────────────────────────────────────────

  if (!venueData) {
    return (
      <div className='venue-landing'>
        <div className='venue-landing__not-found'>
          <UtensilsCrossed size={48} />
          <h1>Establecimiento no encontrado</h1>
          <p>
            No existe un establecimiento con el código <strong>{slug}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // ─── Resolve links (use configured or defaults) ────────────────

  const links =
    venueData.landing_links.length > 0
      ? venueData.landing_links
      : getDefaultLinks();

  const isDemo = slug === DEMO_SLUG;

  // ─── Render Landing ────────────────────────────────────────────

  return (
    <div className={`venue-landing ${exiting ? 'venue-landing--exit' : ''}`}>
      {isDemo && <DemoBanner userEmail={DEMO_EMAIL} />}

      {/* Avatar / Logo */}
      <div className='venue-landing__avatar'>
        {venueData.logo_url ? (
          <img
            src={venueData.logo_url}
            alt={`Logo de ${venueData.name}`}
            loading='eager'
          />
        ) : (
          <div className='venue-landing__avatar-fallback'>
            {venueData.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Venue Info */}
      <div className='venue-landing__info'>
        <h1 className='venue-landing__name'>{venueData.name}</h1>
        {venueData.cuisine_type && (
          <span className='venue-landing__cuisine'>
            {venueData.cuisine_type}
          </span>
        )}
      </div>

      {/* Links */}
      <div className='venue-landing__links'>
        {links.map((link, idx) => {
          // Wi-Fi renders differently — no click action, shows password inline
          if (link.type === 'wifi') {
            return (
              <div
                key={idx}
                className='venue-landing__link venue-landing__wifi'
              >
                <div className='venue-landing__wifi-header'>
                  <div className='venue-landing__link-icon'>
                    <Wifi size={18} />
                  </div>
                  <span>{link.label}</span>
                </div>
                {link.value && (
                  <div className='venue-landing__wifi-details'>
                    Clave: {link.value}
                  </div>
                )}
              </div>
            );
          }

          const IconComponent = getLinkIcon(link.icon);

          return (
            <button
              key={idx}
              className={`venue-landing__link ${link.isPrimary ? 'venue-landing__link--primary' : ''}`}
              onClick={() => handleLinkClick(link)}
            >
              <div className='venue-landing__link-icon'>
                {link.isPrimary ? (
                  <UtensilsCrossed size={18} />
                ) : (
                  <IconComponent size={18} />
                )}
              </div>
              <span>{link.label}</span>
              {link.type === 'url' && !link.isPrimary && (
                <ExternalLink
                  size={14}
                  style={{ marginLeft: 'auto', opacity: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <footer className='venue-landing__footer'>
        <UtensilsCrossed size={12} />
        <span>Potenciado por Tablia</span>
      </footer>
    </div>
  );
}

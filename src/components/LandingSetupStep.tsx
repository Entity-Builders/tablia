import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Link2,
  Instagram,
  Facebook,
  Globe,
  Phone,
  Wifi,
  MapPin,
  MessageCircle,
  Loader2,
  Save,
} from 'lucide-react';
import type { ParsedContactInfo, LandingLink } from '../types';
import './LandingSetupStep.css';

/**
 * Definition of a potential landing link derived from contact info.
 * Each card can be toggled on/off by the user.
 */
interface LinkCard {
  key: string;
  enabled: boolean;
  link: LandingLink;
  displayValue: string;
}

interface LandingSetupStepProps {
  contactInfo: ParsedContactInfo;
  enriching?: boolean; // true while web enrichment is running
  onConfirm: (links: LandingLink[]) => void;
  onSkip: () => void;
}

/**
 * Convert ParsedContactInfo into an array of toggle-able link cards.
 * Only creates cards for fields that have values.
 */
function buildCardsFromContact(info: ParsedContactInfo): LinkCard[] {
  const cards: LinkCard[] = [];

  if (info.instagram) {
    const handle = info.instagram.startsWith('@')
      ? info.instagram
      : `@${info.instagram}`;
    cards.push({
      key: 'instagram',
      enabled: true,
      link: {
        type: 'url',
        label: `Instagram ${handle}`,
        url: `https://instagram.com/${handle.replace('@', '')}`,
        icon: 'instagram',
      },
      displayValue: handle,
    });
  }

  if (info.facebook) {
    cards.push({
      key: 'facebook',
      enabled: true,
      link: {
        type: 'url',
        label: `Facebook`,
        url: info.facebook.startsWith('http')
          ? info.facebook
          : `https://facebook.com/${info.facebook}`,
        icon: 'facebook',
      },
      displayValue: info.facebook,
    });
  }

  if (info.tiktok) {
    const handle = info.tiktok.startsWith('@')
      ? info.tiktok
      : `@${info.tiktok}`;
    cards.push({
      key: 'tiktok',
      enabled: true,
      link: {
        type: 'url',
        label: `TikTok ${handle}`,
        url: `https://tiktok.com/${handle}`,
        icon: 'tiktok',
      },
      displayValue: handle,
    });
  }

  if (info.phone) {
    cards.push({
      key: 'phone',
      enabled: true,
      link: {
        type: 'phone',
        label: `Llamar: ${info.phone}`,
        url: info.phone,
        icon: 'phone',
      },
      displayValue: info.phone,
    });
  }

  if (info.whatsapp) {
    cards.push({
      key: 'whatsapp',
      enabled: true,
      link: {
        type: 'whatsapp',
        label: 'WhatsApp',
        url: info.whatsapp,
        icon: 'whatsapp',
      },
      displayValue: info.whatsapp,
    });
  }

  if (info.website) {
    cards.push({
      key: 'website',
      enabled: false, // off by default — IG/phone are more useful for diners
      link: {
        type: 'url',
        label: 'Sitio web',
        url: info.website,
        icon: 'globe',
      },
      displayValue: info.website.replace(/^https?:\/\//, ''),
    });
  }

  if (info.address) {
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(info.address)}`;
    cards.push({
      key: 'address',
      enabled: false, // off by default — diners are already at the venue
      link: {
        type: 'url',
        label: 'Ubicación',
        url: mapsUrl,
        icon: 'map-pin',
      },
      displayValue: info.address,
    });
  }

  if (info.wifi_name || info.wifi_password) {
    cards.push({
      key: 'wifi',
      enabled: true,
      link: {
        type: 'wifi',
        label: info.wifi_name ? `Wi-Fi: ${info.wifi_name}` : 'Wi-Fi',
        value: info.wifi_password || '',
        icon: 'wifi',
      },
      displayValue: info.wifi_password
        ? `${info.wifi_name || 'Wi-Fi'} / ${info.wifi_password}`
        : info.wifi_name || 'Wi-Fi',
    });
  }

  return cards;
}

// ─── Icon Map ────────────────────────────────────────────────────

const ICON_MAP: Record<string, typeof Globe> = {
  instagram: Instagram,
  facebook: Facebook,
  phone: Phone,
  whatsapp: MessageCircle,
  wifi: Wifi,
  globe: Globe,
  'map-pin': MapPin,
  tiktok: Globe,
};

/**
 * LandingSetupStep — Onboarding component shown after menu review.
 * Presents auto-extracted + enriched contact info as toggle cards.
 * User picks which links to show on their public landing page.
 */
export function LandingSetupStep({
  contactInfo,
  enriching = false,
  onConfirm,
  onSkip,
}: LandingSetupStepProps) {
  const [cards, setCards] = useState<LinkCard[]>(() =>
    buildCardsFromContact(contactInfo),
  );
  const [saving, setSaving] = useState(false);
  const prevContactRef = useRef(contactInfo);

  // When contactInfo changes (enrichment finished), merge new data
  // without resetting user toggle states
  useEffect(() => {
    if (contactInfo === prevContactRef.current) return;
    prevContactRef.current = contactInfo;

    const newCards = buildCardsFromContact(contactInfo);
    setCards((prev) => {
      const existing = new Map(prev.map((c) => [c.key, c]));
      return newCards.map((card) => {
        const old = existing.get(card.key);
        // Keep user's toggle state for existing cards
        return old ? { ...card, enabled: old.enabled } : card;
      });
    });
  }, [contactInfo]);

  const toggleCard = useCallback((key: string) => {
    setCards((prev) =>
      prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c)),
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    setSaving(true);

    // Build the final landing_links array
    // Always start with the "Ver Menú" primary button
    const menuLink: LandingLink = {
      type: 'menu',
      label: 'Ver Menú 🍔',
      isPrimary: true,
    };

    const enabledLinks = cards
      .filter((c) => c.enabled)
      .map((c) => c.link);

    const allLinks = [menuLink, ...enabledLinks];

    onConfirm(allLinks);
  }, [cards, onConfirm]);

  const hasCards = cards.length > 0;
  const enabledCount = cards.filter((c) => c.enabled).length;

  return (
    <div className='landing-setup'>
      <div className='landing-setup__intro'>
        <div className='landing-setup__intro-icon'>
          <Link2 size={28} />
        </div>
        <h3>Configurá tu Landing</h3>
        <p>
          Encontramos información de tu local. Elegí qué mostrar cuando
          escaneen tu QR.
        </p>
      </div>

      {enriching && (
        <div className='landing-setup__enriching'>
          <Loader2 size={16} />
          Buscando más información en internet...
        </div>
      )}

      {hasCards ? (
        <div className='landing-setup__cards'>
          {cards.map((card) => {
            const Icon = ICON_MAP[card.link.icon || 'globe'] || Globe;

            return (
              <div
                key={card.key}
                className={`landing-setup__card ${card.enabled ? 'landing-setup__card--active' : ''}`}
                onClick={() => toggleCard(card.key)}
              >
                <div className='landing-setup__card-icon'>
                  <Icon size={18} />
                </div>
                <div className='landing-setup__card-info'>
                  <div className='landing-setup__card-label'>
                    {card.link.label}
                  </div>
                  <div className='landing-setup__card-value'>
                    {card.displayValue}
                  </div>
                </div>
                <label className='landing-setup__toggle'>
                  <input
                    type='checkbox'
                    checked={card.enabled}
                    onChange={() => toggleCard(card.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className='landing-setup__toggle-track' />
                  <span className='landing-setup__toggle-thumb' />
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='landing-setup__empty'>
          {enriching
            ? 'Buscando información de tu local...'
            : 'No encontramos datos de contacto. Podés agregarlos después desde el dashboard.'}
        </div>
      )}

      <div className='landing-setup__actions'>
        <button className='landing-setup__btn' onClick={onSkip}>
          Omitir
        </button>
        <button
          className='landing-setup__btn landing-setup__btn--primary'
          onClick={handleConfirm}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 size={14} /> Guardando...
            </>
          ) : enabledCount > 0 ? (
            <>
              <Save size={14} /> Guardar {enabledCount} link
              {enabledCount !== 1 ? 's' : ''}
            </>
          ) : (
            'Continuar sin links'
          )}
        </button>
      </div>
    </div>
  );
}

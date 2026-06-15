import { useState, useCallback } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
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
  Save,
  Loader2,
} from 'lucide-react';
import type { LandingLink, LandingLinkType, LandingLinkIcon } from '../types';
import {
  captureOwnerError,
  trackOwnerEvent,
} from '../services/owner-analytics';
import './LandingLinksEditor.css';

const MAX_LINKS = 6;

// ─── Icon Map ────────────────────────────────────────────────────

const ICON_MAP: Record<LandingLinkIcon, typeof Globe> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Globe,
  twitter: Globe,
  calendar: Calendar,
  star: Star,
  phone: Phone,
  wifi: Wifi,
  globe: Globe,
  'map-pin': MapPin,
  mail: Mail,
  whatsapp: MessageCircle,
};

const ICON_OPTIONS: { value: LandingLinkIcon; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'star', label: 'Estrella' },
  { value: 'calendar', label: 'Calendario' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'mail', label: 'Email' },
  { value: 'map-pin', label: 'Ubicación' },
  { value: 'globe', label: 'Web' },
];

const TYPE_OPTIONS: { value: LandingLinkType; label: string }[] = [
  { value: 'url', label: 'Link externo' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

interface LandingLinksEditorProps {
  venueId: string;
  venueSlug?: string;
  initialLinks: LandingLink[];
  onSaved?: () => void;
}

export function LandingLinksEditor({
  venueId,
  venueSlug,
  initialLinks,
  onSaved,
}: LandingLinksEditorProps) {
  // Ensure there's always a "menu" link
  const ensureMenuLink = (links: LandingLink[]): LandingLink[] => {
    const hasMenu = links.some((l) => l.type === 'menu');
    if (!hasMenu) {
      return [
        { type: 'menu', label: 'Ver Menú 🍔', isPrimary: true },
        ...links,
      ];
    }
    return links;
  };

  const [links, setLinks] = useState<LandingLink[]>(
    ensureMenuLink(initialLinks),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form state for adding a new link
  const [formType, setFormType] = useState<LandingLinkType>('url');
  const [formLabel, setFormLabel] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formValue, setFormValue] = useState(''); // wifi password
  const [formIcon, setFormIcon] = useState<LandingLinkIcon>('globe');

  // ─── Handlers ──────────────────────────────────────────────────

  const handleMoveUp = useCallback(
    (idx: number) => {
      if (idx <= 0) return;
      const next = [...links];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      setLinks(next);
      setDirty(true);
    },
    [links],
  );

  const handleMoveDown = useCallback(
    (idx: number) => {
      if (idx >= links.length - 1) return;
      const next = [...links];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      setLinks(next);
      setDirty(true);
    },
    [links],
  );

  const handleDelete = useCallback(
    (idx: number) => {
      // Can't delete the menu link
      if (links[idx].type === 'menu') return;
      setLinks((prev) => prev.filter((_, i) => i !== idx));
      setDirty(true);
    },
    [links],
  );

  const handleAddLink = useCallback(() => {
    if (!formLabel.trim()) return;

    const newLink: LandingLink = {
      type: formType,
      label: formLabel.trim(),
      icon: formType === 'wifi' ? 'wifi' : formType === 'phone' ? 'phone' : formType === 'whatsapp' ? 'whatsapp' : formIcon,
    };

    if (formType === 'wifi') {
      newLink.value = formValue;
    } else {
      newLink.url = formUrl;
    }

    setLinks((prev) => [...prev, newLink]);
    setDirty(true);
    setShowForm(false);
    resetForm();
  }, [formType, formLabel, formUrl, formValue, formIcon]);

  const resetForm = () => {
    setFormType('url');
    setFormLabel('');
    setFormUrl('');
    setFormValue('');
    setFormIcon('globe');
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { updateVenueLandingLinks } = await import(
        '../services/venue-service'
      );
      await updateVenueLandingLinks(venueId, links);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      trackOwnerEvent('landing_links_saved', {
        slug: venueSlug,
        link_count: links.length,
      });
      onSaved?.();
    } catch (err) {
      captureOwnerError('landing_links_save_failed', err, {
        slug: venueSlug,
        workflow: 'landing_links_save',
      });
      alert(
        err instanceof Error
          ? err.message
          : 'Error al guardar los links',
      );
    } finally {
      setSaving(false);
    }
  }, [venueId, venueSlug, links, onSaved]);

  // ─── Render ────────────────────────────────────────────────────

  const nonMenuLinks = links.filter((l) => l.type !== 'menu');
  const canAdd = links.length < MAX_LINKS;

  return (
    <div className='landing-editor'>
      <div className='landing-editor__header'>
        <h3>
          <Link2 size={18} />
          Landing Page
        </h3>
      </div>

      <div className='landing-editor__list'>
        {links.map((link, idx) => {
          const isPrimary = link.type === 'menu';
          const IconComp =
            isPrimary
              ? UtensilsCrossed
              : ICON_MAP[link.icon || 'globe'] || Globe;

          return (
            <div
              key={idx}
              className={`landing-editor__item ${isPrimary ? 'landing-editor__item--primary' : ''}`}
            >
              <div className='landing-editor__item-icon'>
                <IconComp size={16} />
              </div>
              <div className='landing-editor__item-info'>
                <div className='landing-editor__item-label'>{link.label}</div>
                {link.url && (
                  <div className='landing-editor__item-detail'>{link.url}</div>
                )}
                {link.type === 'wifi' && link.value && (
                  <div className='landing-editor__item-detail'>
                    Clave: {link.value}
                  </div>
                )}
                {isPrimary && (
                  <div className='landing-editor__item-detail'>
                    Siempre visible · Abre el menú
                  </div>
                )}
              </div>
              <div className='landing-editor__item-actions'>
                {!isPrimary && (
                  <>
                    <button
                      className='landing-editor__item-btn'
                      onClick={() => handleMoveUp(idx)}
                      title='Mover arriba'
                      disabled={idx === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className='landing-editor__item-btn'
                      onClick={() => handleMoveDown(idx)}
                      title='Mover abajo'
                      disabled={idx === links.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      className='landing-editor__item-btn landing-editor__item-btn--danger'
                      onClick={() => handleDelete(idx)}
                      title='Eliminar'
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {nonMenuLinks.length === 0 && (
          <div className='landing-editor__empty'>
            <p>
              Agregá links para que tus clientes vean al escanear el QR
              (Instagram, Wi-Fi, reservas, etc.)
            </p>
          </div>
        )}

        {canAdd && !showForm && (
          <button
            className='landing-editor__add'
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Agregar link ({links.length}/{MAX_LINKS})
          </button>
        )}
      </div>

      {/* Add Link Form */}
      {showForm && (
        <div className='landing-editor__form'>
          <div className='landing-editor__form-row'>
            <label>Tipo</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as LandingLinkType)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className='landing-editor__form-row'>
            <label>Texto del botón</label>
            <input
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder={
                formType === 'wifi'
                  ? 'Ej: Wi-Fi Gratis'
                  : formType === 'phone'
                    ? 'Ej: Llamar al local'
                    : 'Ej: Síguenos en Instagram'
              }
            />
          </div>

          {formType === 'wifi' ? (
            <div className='landing-editor__form-row'>
              <label>Contraseña Wi-Fi</label>
              <input
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder='Ej: MiBar2024'
              />
            </div>
          ) : (
            <div className='landing-editor__form-row'>
              <label>
                {formType === 'phone'
                  ? 'Número de teléfono'
                  : formType === 'whatsapp'
                    ? 'Número de WhatsApp'
                    : 'URL'}
              </label>
              <input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder={
                  formType === 'phone'
                    ? 'Ej: +5491112345678'
                    : formType === 'whatsapp'
                      ? 'Ej: +5491112345678'
                      : 'Ej: https://instagram.com/mibar'
                }
              />
            </div>
          )}

          {formType === 'url' && (
            <div className='landing-editor__form-row'>
              <label>Ícono</label>
              <select
                value={formIcon}
                onChange={(e) =>
                  setFormIcon(e.target.value as LandingLinkIcon)
                }
              >
                {ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='landing-editor__form-actions'>
            <button
              className='landing-editor__form-btn'
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancelar
            </button>
            <button
              className='landing-editor__form-btn landing-editor__form-btn--primary'
              onClick={handleAddLink}
              disabled={!formLabel.trim()}
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className='landing-editor__save-bar'>
        {saved && (
          <span className='landing-editor__saved-msg'>✓ Guardado</span>
        )}
        <button
          className='landing-editor__save-btn'
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          {saving ? (
            <>
              <Loader2 size={14} className='menu-import__spin' /> Guardando...
            </>
          ) : (
            <>
              <Save size={14} /> Guardar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

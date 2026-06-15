import { useEffect, useState } from 'react';
import { Check, Gift, Loader2, Megaphone, Save } from 'lucide-react';
import {
  captureOwnerError,
  trackOwnerEvent,
} from '../services/owner-analytics';
import './EngagementEditor.css';

interface EngagementEditorProps {
  venueId: string;
  venueSlug?: string;
}

export function EngagementEditor({ venueId, venueSlug }: EngagementEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loyaltyId, setLoyaltyId] = useState<string | undefined>();
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [visitsRequired, setVisitsRequired] = useState(5);
  const [rewardLabel, setRewardLabel] = useState('un postre de cortesía');

  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [campaignEnabled, setCampaignEnabled] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('Promo flash de hoy');
  const [campaignBody, setCampaignBody] = useState(
    'Pedí una parrillada para compartir y sumá un flan mixto con 20% off.',
  );
  const [campaignCta, setCampaignCta] = useState('Válido hoy en el local');

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        const { getVenueEngagementConfig } = await import(
          '../services/engagement-service'
        );
        const config = await getVenueEngagementConfig(venueId);
        if (cancelled) return;

        const program = config.loyaltyProgram;
        setLoyaltyId(program?.id);
        setLoyaltyEnabled(program?.status === 'active');
        setVisitsRequired(program?.rules.visits_required ?? 5);
        setRewardLabel(program?.rules.reward_label ?? 'un postre de cortesía');

        const campaign = config.flashCampaign;
        setCampaignId(campaign?.id);
        setCampaignEnabled(campaign?.status === 'active');
        setCampaignTitle(campaign?.title ?? 'Promo flash de hoy');
        setCampaignBody(
          campaign?.body ??
            'Pedí una parrillada para compartir y sumá un flan mixto con 20% off.',
        );
        setCampaignCta(campaign?.cta_label ?? 'Válido hoy en el local');
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'No se pudo cargar engagement',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const { saveFlashCampaign, saveLoyaltyProgram } = await import(
        '../services/engagement-service'
      );
      const [program, campaign] = await Promise.all([
        saveLoyaltyProgram(venueId, {
          id: loyaltyId,
          enabled: loyaltyEnabled,
          visitsRequired,
          rewardLabel,
        }),
        saveFlashCampaign(venueId, {
          id: campaignId,
          enabled: campaignEnabled,
          title: campaignTitle,
          body: campaignBody,
          ctaLabel: campaignCta,
        }),
      ]);

      setLoyaltyId(program.id);
      setCampaignId(campaign.id);
      trackOwnerEvent('engagement_config_saved', {
        slug: venueSlug,
        has_loyalty: loyaltyEnabled,
        has_campaign: campaignEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      captureOwnerError('engagement_config_save_failed', err, {
        slug: venueSlug,
        workflow: 'engagement_config_save',
        has_loyalty: loyaltyEnabled,
        has_campaign: campaignEnabled,
      });
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar engagement',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='engagement-editor'>
      <div className='engagement-editor__header'>
        <h3>
          <Gift size={18} />
          Loyalty y promos
        </h3>
      </div>

      {loading ? (
        <div className='engagement-editor__loading'>
          <Loader2 size={16} className='menu-import__spin' />
          Cargando...
        </div>
      ) : (
        <>
          <section className='engagement-editor__section'>
            <div className='engagement-editor__section-head'>
              <div>
                <h4>
                  <Gift size={16} />
                  Club de visitas
                </h4>
                <p>
                  {visitsRequired} visitas {'->'} {rewardLabel}
                </p>
              </div>
              <label className='engagement-editor__switch'>
                <input
                  type='checkbox'
                  checked={loyaltyEnabled}
                  onChange={(event) =>
                    setLoyaltyEnabled(event.target.checked)
                  }
                />
                <span />
              </label>
            </div>

            <div className='engagement-editor__fields engagement-editor__fields--loyalty'>
              <label>
                <span>Visitas</span>
                <input
                  type='number'
                  min='1'
                  max='30'
                  value={visitsRequired}
                  onChange={(event) =>
                    setVisitsRequired(Number(event.target.value))
                  }
                />
              </label>
              <label>
                <span>Recompensa</span>
                <input
                  value={rewardLabel}
                  onChange={(event) => setRewardLabel(event.target.value)}
                  placeholder='un postre de cortesía'
                />
              </label>
            </div>
          </section>

          <section className='engagement-editor__section'>
            <div className='engagement-editor__section-head'>
              <div>
                <h4>
                  <Megaphone size={16} />
                  Promo flash
                </h4>
                <p>{campaignTitle}</p>
              </div>
              <label className='engagement-editor__switch'>
                <input
                  type='checkbox'
                  checked={campaignEnabled}
                  onChange={(event) =>
                    setCampaignEnabled(event.target.checked)
                  }
                />
                <span />
              </label>
            </div>

            <div className='engagement-editor__fields'>
              <label>
                <span>Título</span>
                <input
                  value={campaignTitle}
                  onChange={(event) => setCampaignTitle(event.target.value)}
                  placeholder='Promo flash de hoy'
                />
              </label>
              <label>
                <span>Mensaje</span>
                <textarea
                  value={campaignBody}
                  onChange={(event) => setCampaignBody(event.target.value)}
                  rows={3}
                  placeholder='20% off en postres hasta las 22 hs'
                />
              </label>
              <label>
                <span>Detalle</span>
                <input
                  value={campaignCta}
                  onChange={(event) => setCampaignCta(event.target.value)}
                  placeholder='Válido hoy en el local'
                />
              </label>
            </div>
          </section>

          {error && <p className='engagement-editor__error'>{error}</p>}

          <div className='engagement-editor__save-bar'>
            {saved && (
              <span className='engagement-editor__saved'>
                <Check size={14} />
                Guardado
              </span>
            )}
            <button
              className='engagement-editor__save'
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className='menu-import__spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Guardar
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

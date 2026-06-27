import { useState, useRef, useCallback, useEffect } from 'react';
import type { ParsedMenu, ParsedContactInfo, LandingLink } from '../types';
import { MenuReview } from './MenuReview';
import { LandingSetupStep } from './LandingSetupStep';
import { MenuImportInputStep } from './MenuImportInputStep';
import {
  bucketConfidence,
  bucketCount,
  bucketFileSize,
  captureOwnerError,
  trackOwnerEvent,
} from '../services/owner-analytics';
import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '../services/menu-parser-service';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import './MenuImport.css';

type ImportStep = 'input' | 'parsing' | 'review' | 'landing-setup' | 'done';
type InputMode = 'file' | 'text';

const PARSING_MESSAGES = [
  'Leyendo el menú…',
  'Identificando secciones y categorías…',
  'Extrayendo platos y precios…',
  'Detectando etiquetas dietarias…',
  'Buscando datos de contacto…',
  'Organizando la estructura…',
  'Casi listo, últimos ajustes…',
];

interface MenuImportProps {
  venueId: string;
  venueSlug: string;
  onMenuCreated: () => void;
  onCancel: () => void;
}

export function MenuImport({
  venueId,
  venueSlug,
  onMenuCreated,
  onCancel,
}: MenuImportProps) {
  const [step, setStep] = useState<ImportStep>('input');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [menuText, setMenuText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenu | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Landing setup state
  const [contactInfo, setContactInfo] = useState<ParsedContactInfo>({});
  const [enriching, setEnriching] = useState(false);
  const enrichStarted = useRef(false);

  // Cycle loading messages while parsing
  useEffect(() => {
    if (step !== 'parsing') return;
    setLoadingMsgIdx(0);
    const interval = setInterval(() => {
      setLoadingMsgIdx((prev) =>
        prev < PARSING_MESSAGES.length - 1 ? prev + 1 : prev,
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [step]);

  // ─── File validation ────────────────────────────────────────────

  const validateAndSetFile = useCallback((file: File) => {
    setError(null);

    if (!SUPPORTED_FILE_TYPES[file.type]) {
      const supported = Object.values(SUPPORTED_FILE_TYPES).join(', ');
      setError(`Formato no soportado. Formatos válidos: ${supported}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `El archivo es demasiado grande (máx ${MAX_FILE_SIZE / 1024 / 1024} MB).`,
      );
      return;
    }

    setSelectedFile(file);
  }, []);

  // ─── Drag & Drop handlers ──────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile],
  );

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ─── Parse handlers ────────────────────────────────────────────

  const canSubmit =
    inputMode === 'text' ? menuText.trim().length > 0 : selectedFile !== null;

  const handleParse = async () => {
    if (!canSubmit) return;
    setError(null);
    setStep('parsing');
    const baseProps = {
      slug: venueSlug,
      input_mode: inputMode,
      file_type: selectedFile?.type,
      file_size_bucket: bucketFileSize(selectedFile?.size),
    };
    trackOwnerEvent('menu_parse_started', baseProps);

    try {
      let nextParsed: ParsedMenu | null = null;
      if (inputMode === 'text') {
        const { createMenuFromText } = await import('../services/menu-service');
        const { menu, parsed } = await createMenuFromText(
          venueId,
          menuText.trim(),
        );
        setMenuId(menu.id);
        setParsedMenu(parsed);
        nextParsed = parsed;
      } else if (selectedFile) {
        const { createMenuFromFile } = await import('../services/menu-service');
        const { menu, parsed } = await createMenuFromFile(
          venueId,
          selectedFile,
        );
        setMenuId(menu.id);
        setParsedMenu(parsed);
        nextParsed = parsed;
      }
      const categoryCount = nextParsed?.categories.length ?? 0;
      const itemCount =
        nextParsed?.categories.reduce(
          (sum, category) => sum + category.items.length,
          0,
        ) ?? 0;
      trackOwnerEvent('menu_parse_succeeded', {
        ...baseProps,
        category_count: categoryCount,
        item_count_bucket: bucketCount(itemCount),
        confidence_bucket: bucketConfidence(
          nextParsed?.metadata?.confidence,
        ),
      });
      setStep('review');
    } catch (err) {
      captureOwnerError('menu_parse_failed', err, {
        ...baseProps,
        workflow: 'menu_parse',
      });
      setError(err instanceof Error ? err.message : 'Error al parsear el menú');
      setStep('input');
    }
  };

  // Start enrichment in background when we enter the review step
  // ONLY as fallback — if the PDF already extracted enough contact data, skip web search
  useEffect(() => {
    if (step !== 'review' || enrichStarted.current || !parsedMenu) return;
    enrichStarted.current = true;

    const restaurantName = parsedMenu.metadata?.restaurant_name;
    if (!restaurantName) return;

    const pdfContact = parsedMenu.contact_info ?? {};
    setContactInfo(pdfContact);

    // Count how many contact fields the PDF already extracted
    const pdfFieldCount = Object.values(pdfContact).filter(
      (v) => v !== undefined && v !== null && v !== '',
    ).length;

    // If PDF already has 3+ fields, no need to search the web
    if (pdfFieldCount >= 3) {
      console.log(
        `[MenuImport] PDF extracted ${pdfFieldCount} contact fields, skipping web enrichment.`,
      );
      return;
    }

    // Fallback: search the web for missing info
    console.log(
      `[MenuImport] PDF only has ${pdfFieldCount} contact fields, enriching from web...`,
    );
    setEnriching(true);

    const runEnrichment = async () => {
      try {
        const { enrichVenueFromWeb } = await import(
          '../services/venue-enrichment-service'
        );
        const enriched = await enrichVenueFromWeb(restaurantName, pdfContact);
        setContactInfo(enriched);
      } catch {
        // Enrichment failed — use PDF-only data
      } finally {
        setEnriching(false);
      }
    };

    runEnrichment();
  }, [step, parsedMenu]);

  const handleConfirm = async (editedMenu: ParsedMenu) => {
    if (!menuId) return;
    setError(null);

    try {
      const { confirmParsedMenu } = await import('../services/menu-service');
      await confirmParsedMenu(menuId, editedMenu);
      const itemCount = editedMenu.categories.reduce(
        (sum, category) => sum + category.items.length,
        0,
      );
      trackOwnerEvent('menu_review_confirmed', {
        slug: venueSlug,
        category_count: editedMenu.categories.length,
        item_count_bucket: bucketCount(itemCount),
        confidence_bucket: bucketConfidence(editedMenu.metadata?.confidence),
      });

      // If we have any contact info (from PDF or enrichment), show landing setup
      const hasContactData = Object.values(contactInfo).some(
        (v) => v !== undefined && v !== null && v !== '',
      );

      if (hasContactData || enriching) {
        setStep('landing-setup');
      } else {
        setStep('done');
      }
    } catch (err) {
      captureOwnerError('menu_publish_failed', err, {
        slug: venueSlug,
        workflow: 'menu_publish',
      });
      setError(err instanceof Error ? err.message : 'Error al guardar el menú');
    }
  };

  // ─── Landing setup handlers ─────────────────────────────────────

  const handleLandingConfirm = async (links: LandingLink[]) => {
    try {
      const { updateVenueLandingLinks } = await import(
        '../services/venue-service'
      );
      await updateVenueLandingLinks(venueId, links);
      trackOwnerEvent('landing_setup_completed', {
        slug: venueSlug,
        link_count: links.length,
        had_contact_data: true,
      });
    } catch {
      captureOwnerError('landing_links_save_failed', new Error('save_failed'), {
        slug: venueSlug,
        workflow: 'landing_setup',
      });
      // Non-critical — user can configure later from dashboard
      console.warn('[MenuImport] Failed to save landing links');
    }
    setStep('done');
  };

  const handleLandingSkip = () => {
    trackOwnerEvent('landing_setup_skipped', {
      slug: venueSlug,
    });
    setStep('done');
  };

  // ─── Step: Input ──────────────────────────────────────────────

  if (step === 'input') {
    return (
      <MenuImportInputStep
        inputMode={inputMode}
        menuText={menuText}
        selectedFile={selectedFile}
        error={error}
        canSubmit={canSubmit}
        isDragOver={isDragOver}
        fileInputRef={fileInputRef}
        onCancel={onCancel}
        onInputModeChange={setInputMode}
        onMenuTextChange={setMenuText}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onParse={handleParse}
      />
    );
  }

  // ─── Step: Parsing ────────────────────────────────────────────

  if (step === 'parsing') {
    return (
      <div className='menu-import'>
        <div className='menu-import__body menu-import__body--center'>
          <div className='menu-import__spinner'>
            <Loader2 size={40} className='menu-import__spin' />
          </div>
          <h3>Analizando tu menú...</h3>
          <p className='menu-import__loading-msg' key={loadingMsgIdx}>
            {PARSING_MESSAGES[loadingMsgIdx]}
          </p>
          <div className='menu-import__loading-dots'>
            {PARSING_MESSAGES.map((_, i) => (
              <span
                key={i}
                className={`menu-import__dot ${i <= loadingMsgIdx ? 'menu-import__dot--active' : ''}`}
              />
            ))}
          </div>
          {loadingMsgIdx >= PARSING_MESSAGES.length - 1 && (
            <p className='menu-import__loading-hint'>
              Podés cerrar esta ventana. Cuando vuelvas, tu menú va a estar
              listo para revisar.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Step: Review ─────────────────────────────────────────────

  if (step === 'review' && parsedMenu) {
    return (
      <div className='menu-import'>
        <div className='menu-import__header'>
          <button
            className='menu-import__back'
            onClick={() => setStep('input')}
          >
            <ArrowLeft size={20} />
          </button>
          <h2>Revisá tu menú</h2>
        </div>

        {parsedMenu.metadata && (
          <div className='menu-import__meta'>
            {parsedMenu.metadata.cuisine_type && (
              <span className='menu-import__tag'>
                {parsedMenu.metadata.cuisine_type}
              </span>
            )}
            <span className='menu-import__confidence'>
              Confianza:{' '}
              {Math.round((parsedMenu.metadata.confidence || 0) * 100)}%
            </span>
          </div>
        )}

        {error && (
          <div className='menu-import__error'>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <MenuReview parsedMenu={parsedMenu} onConfirm={handleConfirm} />
      </div>
    );
  }

  // ─── Step: Landing Setup ──────────────────────────────────────

  if (step === 'landing-setup') {
    return (
      <div className='menu-import'>
        <div className='menu-import__header'>
          <button
            className='menu-import__back'
            onClick={() => setStep('review')}
          >
            <ArrowLeft size={20} />
          </button>
          <h2>Tu Landing Page</h2>
        </div>

        <div className='menu-import__body'>
          <LandingSetupStep
            contactInfo={contactInfo}
            enriching={enriching}
            onConfirm={handleLandingConfirm}
            onSkip={handleLandingSkip}
          />
        </div>
      </div>
    );
  }

  // ─── Step: Done ───────────────────────────────────────────────

  if (step === 'done') {
    const menuUrl = `${window.location.origin}/m/${venueSlug}`;
    return (
      <div className='menu-import'>
        <div className='menu-import__body menu-import__body--center'>
          <div className='menu-import__success-icon'>
            <CheckCircle2 size={48} />
          </div>
          <h3>¡Menú publicado!</h3>
          <p className='menu-import__hint'>
            Tu menú ya está activo. Compartí este link o generá un QR.
          </p>

          <div className='menu-import__link-box'>
            <QrCode size={18} />
            <a href={menuUrl} target='_blank' rel='noopener noreferrer'>
              {menuUrl}
            </a>
          </div>

          <button className='menu-import__submit' onClick={onMenuCreated}>
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}

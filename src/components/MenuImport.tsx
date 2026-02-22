import { useState } from 'react';
import type { ParsedMenu } from '../types';
import { MenuReview } from './MenuReview';
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  QrCode,
} from 'lucide-react';
import './MenuImport.css';

type ImportStep = 'input' | 'parsing' | 'review' | 'done';

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
  const [menuText, setMenuText] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [parsedMenu, setParsedMenu] = useState<ParsedMenu | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!menuText.trim()) return;
    setError(null);
    setStep('parsing');

    try {
      const { createMenuFromText } = await import('../services/menu-service');
      const { menu, parsed } = await createMenuFromText(
        venueId,
        menuText.trim(),
      );
      setMenuId(menu.id);
      setParsedMenu(parsed);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al parsear el menú');
      setStep('input');
    }
  };

  const handleConfirm = async (editedMenu: ParsedMenu) => {
    if (!menuId) return;
    setError(null);

    try {
      const { confirmParsedMenu } = await import('../services/menu-service');
      await confirmParsedMenu(menuId, editedMenu);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el menú');
    }
  };

  // ─── Step: Input ──────────────────────────────────────────────

  if (step === 'input') {
    return (
      <div className='menu-import'>
        <div className='menu-import__header'>
          <button className='menu-import__back' onClick={onCancel}>
            <ArrowLeft size={20} />
          </button>
          <h2>Importar menú</h2>
        </div>

        <div className='menu-import__body'>
          <div className='menu-import__icon'>
            <FileText size={40} />
          </div>
          <p className='menu-import__hint'>
            Pegá el texto de tu menú. Puede ser un copy-paste de WhatsApp, una
            lista de platos con precios, o el contenido de tu menú actual.
          </p>

          <textarea
            className='menu-import__textarea'
            placeholder={`Ejemplo:\n\nENTRADAS\nEmpanadas de carne (x3) $2500\nProvoleta con orégano $3200\n\nPLATOS PRINCIPALES\nBife de chorizo con papas $8500\nMilanesa napolitana con fritas $7200\n\nBEBIDAS\nCoca-Cola $1500\nCerveza artesanal IPA $3000`}
            value={menuText}
            onChange={(e) => setMenuText(e.target.value)}
            rows={14}
          />

          {error && (
            <div className='menu-import__error'>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            className='menu-import__submit'
            onClick={handleParse}
            disabled={!menuText.trim()}
          >
            Analizar con IA
          </button>
        </div>
      </div>
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
          <p className='menu-import__hint'>
            Tablia está identificando secciones, platos, precios y etiquetas.
          </p>
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

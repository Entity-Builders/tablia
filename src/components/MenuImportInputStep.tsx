import type { ChangeEvent, DragEvent, RefObject } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  File as FileIcon,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import { SUPPORTED_FILE_TYPES } from '../services/menu-parser-service';

type InputMode = 'file' | 'text';

interface MenuImportInputStepProps {
  inputMode: InputMode;
  menuText: string;
  selectedFile: File | null;
  error: string | null;
  canSubmit: boolean;
  isDragOver: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onCancel: () => void;
  onInputModeChange: (mode: InputMode) => void;
  onMenuTextChange: (text: string) => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onParse: () => void;
}

const ACCEPT_STRING = Object.keys(SUPPORTED_FILE_TYPES).join(',');

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MenuImportInputStep({
  inputMode,
  menuText,
  selectedFile,
  error,
  canSubmit,
  isDragOver,
  fileInputRef,
  onCancel,
  onInputModeChange,
  onMenuTextChange,
  onFileSelect,
  onFileRemove,
  onDragOver,
  onDragLeave,
  onDrop,
  onParse,
}: MenuImportInputStepProps) {
  return (
    <div className='menu-import'>
      <div className='menu-import__header'>
        <button className='menu-import__back' onClick={onCancel}>
          <ArrowLeft size={20} />
        </button>
        <h2>Importar menú</h2>
      </div>

      <div className='menu-import__body'>
        <div className='menu-import__tabs'>
          <button
            className={`menu-import__tab ${inputMode === 'file' ? 'menu-import__tab--active' : ''}`}
            onClick={() => onInputModeChange('file')}
          >
            <Upload size={16} />
            Archivo
          </button>
          <button
            className={`menu-import__tab ${inputMode === 'text' ? 'menu-import__tab--active' : ''}`}
            onClick={() => onInputModeChange('text')}
          >
            <FileText size={16} />
            Texto
          </button>
        </div>

        {inputMode === 'file' && (
          <>
            <p className='menu-import__hint'>
              Subí un PDF o foto de tu menú. Tablia lo analiza automáticamente
              con inteligencia artificial.
            </p>

            {!selectedFile ? (
              <div
                className={`menu-import__dropzone ${isDragOver ? 'menu-import__dropzone--active' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className='menu-import__dropzone-icon' />
                <span className='menu-import__dropzone-text'>
                  Arrastrá un archivo o hacé clic para buscar
                </span>
                <span className='menu-import__dropzone-formats'>
                  PDF, JPG, PNG o WebP · máx 10 MB
                </span>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept={ACCEPT_STRING}
                  onChange={onFileSelect}
                  className='menu-import__file-input'
                />
              </div>
            ) : (
              <div className='menu-import__file-preview'>
                <FileIcon size={20} />
                <div className='menu-import__file-info'>
                  <span className='menu-import__file-name'>
                    {selectedFile.name}
                  </span>
                  <span className='menu-import__file-size'>
                    {formatSize(selectedFile.size)}
                  </span>
                </div>
                <button
                  className='menu-import__file-remove'
                  onClick={onFileRemove}
                  title='Quitar archivo'
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {inputMode === 'text' && (
          <>
            <p className='menu-import__hint'>
              Pegá el texto de tu menú. Puede ser un copy-paste de WhatsApp,
              una lista de platos con precios, o el contenido de tu menú actual.
            </p>

            <textarea
              className='menu-import__textarea'
              placeholder={`Ejemplo:\n\nENTRADAS\nEmpanadas de carne (x3) $2500\nProvoleta con orégano $3200\n\nPLATOS PRINCIPALES\nBife de chorizo con papas $8500\nMilanesa napolitana con fritas $7200\n\nBEBIDAS\nCoca-Cola $1500\nCerveza artesanal IPA $3000`}
              value={menuText}
              onChange={(event) => onMenuTextChange(event.target.value)}
              rows={14}
            />
          </>
        )}

        {error && (
          <div className='menu-import__error'>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          className='menu-import__submit'
          onClick={onParse}
          disabled={!canSubmit}
        >
          Analizar con IA
        </button>
      </div>
    </div>
  );
}

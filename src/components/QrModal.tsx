import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import './QrModal.css';

interface QrModalProps {
  url: string;
  venueName: string;
  onClose: () => void;
}

export function QrModal({ url, venueName, onClose }: QrModalProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasWrapRef.current?.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qr-${venueName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [venueName]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className='qr-overlay' onClick={handleOverlayClick}>
      <div className='qr-modal'>
        <button className='qr-modal__close' onClick={onClose}>
          <X size={20} />
        </button>

        <div className='qr-modal__qr-wrap' ref={canvasWrapRef}>
          <QRCodeCanvas value={url} size={220} level='H' marginSize={1} />
        </div>

        <div className='qr-modal__venue'>{venueName}</div>
        <div className='qr-modal__url'>{url}</div>

        <button className='qr-modal__download' onClick={handleDownload}>
          <Download size={18} />
          Descargar PNG
        </button>
      </div>
    </div>
  );
}

import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './DemoBanner.css';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'seed@tablia.dev';

interface DemoBannerProps {
  userEmail: string | undefined;
}

export function DemoBanner({ userEmail }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Only show banner for demo account user
  if (dismissed || userEmail !== DEMO_EMAIL) return null;

  const handleSignUp = async () => {
    // Navigate first via hard redirect so ProtectedRoute's <Navigate to="/login">
    // can't race and override our ?mode=register param, then sign out.
    window.location.href = '/login?mode=register';
    await supabase.auth.signOut();
  };

  return (
    <div className='demo-banner'>
      <div className='demo-banner__content'>
        <Sparkles size={16} className='demo-banner__icon' />
        <span className='demo-banner__text'>
          Estás viendo la <strong>cuenta demo</strong> de Tablia. Todo lo que
          ves aquí —analytics, chat de clientes, QR— es lo que tendría tu
          restaurante.
        </span>
        <button className='demo-banner__cta' onClick={handleSignUp}>
          Crear mi cuenta gratis →
        </button>
      </div>
      <button
        className='demo-banner__dismiss'
        onClick={() => setDismissed(true)}
        aria-label='Cerrar'
      >
        <X size={16} />
      </button>
    </div>
  );
}

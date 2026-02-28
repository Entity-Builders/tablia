import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  UtensilsCrossed,
  QrCode,
  MessageCircle,
  BarChart3,
  Mail,
  Zap,
  Loader2,
  Play,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './LandingPage.css';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'seed@tablia.dev';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'seed-password-dev';

export function LandingPage() {
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setDemoError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (error) throw error;
      // AuthProvider's onAuthStateChange will pick up the session
      // and the ProtectedRoute will allow access to /dashboard
      navigate('/dashboard');
    } catch {
      setDemoError('No se pudo acceder a la demo. Intentá de nuevo.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className='landing'>
      {/* Hero */}
      <header className='landing__hero'>
        <nav className='landing__nav'>
          <div className='landing__logo'>
            <UtensilsCrossed size={28} />
            <span>Tablia</span>
          </div>
          <button
            className='landing__cta-small'
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
        </nav>

        <div className='landing__hero-content'>
          <h1>
            Tu menú, <span className='landing__accent'>potenciado</span>
          </h1>
          <p className='landing__subtitle'>
            Importá tu menú QR actual y potencialo con un asistente IA,
            analytics y CRM. Sin migrar nada.
          </p>
          <button
            className='landing__cta'
            onClick={() => navigate('/login?mode=register')}
          >
            <Zap size={20} />
            Empezá gratis
          </button>
        </div>
      </header>

      {/* Features */}
      <section className='landing__features'>
        <h2>Todo lo que necesitás</h2>
        <div className='landing__features-grid'>
          <div className='landing__feature-card'>
            <div className='landing__feature-icon'>
              <QrCode size={32} />
            </div>
            <h3>Adaptador Universal</h3>
            <p>
              Pegá un link, subí un PDF o una foto. Tablia parsea tu menú
              automáticamente con IA.
            </p>
          </div>

          <div className='landing__feature-card'>
            <div className='landing__feature-icon'>
              <MessageCircle size={32} />
            </div>
            <h3>Chat Inteligente</h3>
            <p>
              Tus clientes pueden preguntarle al menú: alergenos,
              recomendaciones, porciones.
            </p>
          </div>

          <div className='landing__feature-card'>
            <div className='landing__feature-icon'>
              <BarChart3 size={32} />
            </div>
            <h3>Analytics</h3>
            <p>
              Sabé qué platos miran más, qué preguntan, en qué horarios y desde
              qué dispositivos.
            </p>
          </div>

          <div className='landing__feature-card'>
            <div className='landing__feature-icon'>
              <Mail size={32} />
            </div>
            <h3>CRM Integrado</h3>
            <p>
              Capturá emails de comensales y construí tu base para promos y
              novedades.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Demo CTA */}
      <section className='landing__demo-cta'>
        <div className='landing__demo-cta-inner'>
          <div className='landing__demo-cta-text'>
            <h2>Ver el producto antes de registrarte</h2>
            <p>
              Accedé a la cuenta demo de <strong>La Parrilla del Centro</strong>{' '}
              — un restaurante con menú publicado, analytics reales y
              conversaciones de clientes. Sin tarjeta, sin formularios.
            </p>
            {demoError && <p className='landing__demo-error'>{demoError}</p>}
          </div>
          <div className='landing__demo-cta-actions'>
            <button
              className='landing__demo-btn'
              onClick={handleDemoLogin}
              disabled={demoLoading}
            >
              {demoLoading ? (
                <Loader2 size={20} className='landing__demo-spin' />
              ) : (
                <Play size={20} />
              )}
              {demoLoading ? 'Entrando...' : 'Ver demo en vivo'}
            </button>
            <button
              className='landing__cta-small'
              onClick={() => navigate('/login?mode=register')}
            >
              Crear mi cuenta
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='landing__footer'>
        <p>© 2026 Tablia by Entity Builders — tablia.io</p>
      </footer>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  QrCode,
  MessageCircle,
  BarChart3,
  Mail,
  Zap,
} from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();

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
          <button className='landing__cta' onClick={() => navigate('/login')}>
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

      {/* Footer */}
      <footer className='landing__footer'>
        <p>© 2026 Tablia by Entity Builders — tablia.io</p>
      </footer>
    </div>
  );
}

import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, UtensilsCrossed, QrCode } from 'lucide-react';
import './Dashboard.css';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className='dashboard'>
      {/* Header */}
      <header className='dashboard__header'>
        <div className='dashboard__logo'>
          <UtensilsCrossed size={24} />
          <span>Tablia</span>
        </div>
        <div className='dashboard__user'>
          <span className='dashboard__email'>{user?.email}</span>
          <button className='dashboard__signout' onClick={handleSignOut}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className='dashboard__main'>
        <div className='dashboard__title-row'>
          <h1>Mis Menús</h1>
          <button className='dashboard__add-btn'>
            <Plus size={20} />
            Nuevo Menú
          </button>
        </div>

        {/* Empty State */}
        <div className='dashboard__empty'>
          <div className='dashboard__empty-icon'>
            <QrCode size={48} />
          </div>
          <h2>Empezá importando tu primer menú</h2>
          <p>
            Pegá un link, subí un PDF o sacá una foto de tu menú actual. Tablia
            lo parsea automáticamente con IA.
          </p>
          <button className='dashboard__add-btn dashboard__add-btn--large'>
            <Plus size={20} />
            Importar menú
          </button>
        </div>

        {/* Menu list placeholder - will be populated when menus exist */}
        {/* 
        <div className="dashboard__menu-grid">
          <div className="dashboard__menu-card">
            <h3>Menú Principal</h3>
            <p>24 platos · 5 categorías</p>
            <div className="dashboard__menu-stats">
              <span><Eye size={14} /> 342 vistas</span>
              <span><QrCode size={14} /> QR activo</span>
            </div>
          </div>
        </div>
        */}
      </main>
    </div>
  );
}

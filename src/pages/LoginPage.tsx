import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import './LoginPage.css';

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className='login'>
      <div className='login__container'>
        <div className='login__header'>
          <div className='login__logo'>
            <UtensilsCrossed size={32} />
            <span>Tablia</span>
          </div>
          <p className='login__tagline'>Tu menú, potenciado</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(25, 95%, 55%)',
                  brandAccent: 'hsl(25, 95%, 45%)',
                },
              },
            },
          }}
          providers={['google']}
          redirectTo={window.location.origin + '/dashboard'}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Contraseña',
                button_label: 'Iniciar sesión',
                link_text: '¿Ya tenés cuenta? Iniciá sesión',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Contraseña',
                button_label: 'Registrarse',
                link_text: '¿No tenés cuenta? Registrate',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

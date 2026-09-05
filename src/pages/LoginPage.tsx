import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import {
  useSupabaseAccountAccess,
  type SupabaseAuthAccessClient,
} from '@entity-builders/auth';
import { AccountAccessPanel } from '@entity-builders/auth-ui-web';
import { useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { tabliaAuthConfig } from '../lib/auth-config';
import { analytics } from '../services/analytics';
import './LoginPage.css';

const TABLIA_AUTH_MESSAGES = {
  supabaseNotConfigured: 'Supabase no esta configurado en este entorno.',
  missingEmail: 'Ingresa tu email para continuar.',
  missingCredentials: 'Ingresa el email y el codigo.',
  codeSent: 'Revisa tu email e ingresa el codigo aca.',
  connected: 'Cuenta conectada.',
  guestReady: '',
  oauthStarted: 'Continua con Google para terminar el acceso.',
  oauthFailed: 'No pudimos completar el acceso. Proba de nuevo.',
  oauthLinkedIdentityError:
    'Ese Google ya esta conectado a otra cuenta. Usa codigo por email o entra con otra cuenta.',
  authMethodUnavailable: 'Ese metodo no esta disponible para Tablia.',
};

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const entryMode =
    searchParams.get('mode') === 'register' ? 'register' : 'login';
  const account = useSupabaseAccountAccess({
    client: supabase as unknown as SupabaseAuthAccessClient,
    isConfigured: isSupabaseConfigured,
    authConfig: tabliaAuthConfig,
    analytics,
    messages: TABLIA_AUTH_MESSAGES,
  });

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
        <div className='login__auth-panel'>
          <AccountAccessPanel
            config={tabliaAuthConfig}
            account={account}
            slots={{
              header: (
                <div className='login__auth-heading'>
                  <h1>
                    {entryMode === 'register'
                      ? 'Crear cuenta de Tablia'
                      : tabliaAuthConfig.copy?.title}
                  </h1>
                  <p>{tabliaAuthConfig.copy?.subtitle}</p>
                </div>
              ),
              noSessionContent: (
                <p className='login__auth-note'>
                  Entra con codigo por email o Google para administrar tu menu,
                  QR y asistente.
                </p>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}

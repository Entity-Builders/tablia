import {
  buildEntityBuildersAuthRedirectUrl,
  getEntityBuildersAppOrFallback,
} from '@eb-packages/app-registry';
import { createEntityAuthConfig } from '@eb-packages/auth';

const tabliaApp = getEntityBuildersAppOrFallback('tablia');

export const tabliaAuthConfig = createEntityAuthConfig({
  appId: tabliaApp.appId,
  appName: tabliaApp.displayName,
  redirectTo: () =>
    buildEntityBuildersAuthRedirectUrl(tabliaApp.appId, window.location.origin),
  methods: [
    { type: 'email_otp', label: 'Codigo por email' },
    { type: 'oauth', provider: 'google' },
  ],
  copy: {
    title: 'Acceder a Tablia',
    subtitle: 'Gestiona tu menu, QR y asistente con una cuenta segura.',
    emailLabel: 'Email de trabajo',
    emailPlaceholder: 'dueno@restaurante.com',
    codeLabel: 'Codigo',
    codePlaceholder: '000000',
    requestCodeLabel: 'Enviar codigo',
    verifyCodeLabel: 'Verificar codigo',
    resendCodeLabel: 'Enviar nuevo codigo',
    signOutLabel: 'Cerrar sesion',
    unavailableLabel:
      'Faltan variables de Supabase para acceder a Tablia.',
  },
  analyticsContext: {
    app: tabliaApp.analyticsAppId,
  },
});

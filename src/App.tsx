import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

// ─── Lazy-loaded pages (code splitting) ─────────────────────────
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const VenueLanding = lazy(() =>
  import('./pages/VenueLanding').then((m) => ({ default: m.VenueLanding })),
);

function AppFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className='app'>
          <Suspense fallback={<AppFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path='/' element={<LandingPage />} />
              <Route path='/login' element={<LoginPage />} />
              <Route path='/m/:slug' element={<VenueLanding />} />

              {/* Protected routes (restaurantero) */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

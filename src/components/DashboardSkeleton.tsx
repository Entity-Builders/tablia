import { UtensilsCrossed } from 'lucide-react';

export function StatsDashboardSkeleton() {
  return (
    <>
      <section className='dash-stats'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='dash-stat-card dash-stat-card--skeleton'>
            <div className='skeleton skeleton-title' />
            <div
              className='skeleton skeleton-text'
              style={{ height: '2.5rem', width: '80%' }}
            />
            <div
              className='skeleton skeleton-text'
              style={{ height: '0.8rem', width: '60%' }}
            />
          </div>
        ))}
      </section>

      <section className='dash-grid'>
        <div className='dash-card'>
          <div className='dash-card__header'>
            <div className='skeleton skeleton-title' style={{ width: '60%' }} />
          </div>
          <div className='skeleton skeleton-chart' />
        </div>

        <div className='dash-card'>
          <div className='dash-card__header'>
            <div className='skeleton skeleton-title' style={{ width: '50%' }} />
          </div>
          <div className='dash-leaderboard'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className='dash-leader-row'
                style={{ border: 'none' }}
              >
                <div
                  className='skeleton skeleton-icon'
                  style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '4px',
                  }}
                />
                <div className='skeleton skeleton-text' style={{ flex: 1 }} />
                <div
                  className='skeleton skeleton-text'
                  style={{ width: '2.5rem' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='dash-card dash-card--full'>
        <div className='dash-card__header'>
          <div className='skeleton skeleton-title' style={{ width: '30%' }} />
        </div>
        <div className='dash-conversations'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='dash-conv-row'
              style={{ padding: '0.85rem 0' }}
            >
              <div className='skeleton skeleton-icon' />
              <div
                className='skeleton skeleton-text'
                style={{ flex: 1, height: '1.2rem' }}
              />
              <div
                className='skeleton skeleton-text'
                style={{ width: '3rem' }}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function MainDashboardSkeleton() {
  return (
    <>
      {/* Skeleton Hero */}
      <section className='dash-hero'>
        <div style={{ flex: 1 }}>
          <div
            className='skeleton skeleton-title'
            style={{ width: '250px', marginBottom: '0.5rem' }}
          />
          <div
            className='skeleton skeleton-text'
            style={{ width: '180px', height: '1.2rem', borderRadius: '999px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div
            className='skeleton skeleton-text'
            style={{ width: '100px', height: '2rem', borderRadius: '8px' }}
          />
          <div
            className='skeleton skeleton-text'
            style={{ width: '80px', height: '2rem', borderRadius: '8px' }}
          />
          <div
            className='skeleton skeleton-text'
            style={{ width: '40px', height: '2rem', borderRadius: '8px' }}
          />
        </div>
      </section>

      <StatsDashboardSkeleton />
    </>
  );
}

export function FullDashboardSkeleton() {
  return (
    <div className='dashboard'>
      {/* Skeleton Header */}
      <header className='dashboard__header'>
        <div className='dashboard__logo'>
          <UtensilsCrossed size={24} style={{ color: 'var(--accent)' }} />
          <span
            style={{
              color: 'var(--accent)',
              fontWeight: 700,
              fontFamily: 'Outfit',
            }}
          >
            Tablia
          </span>
        </div>
        <div className='dashboard__user'>
          <div
            className='skeleton skeleton-text'
            style={{ width: '120px', height: '1rem', margin: 0 }}
          />
          <div
            className='skeleton skeleton-icon'
            style={{ width: '28px', height: '28px', margin: 0 }}
          />
        </div>
      </header>

      <main className='dashboard__main'>
        <MainDashboardSkeleton />
      </main>
    </div>
  );
}

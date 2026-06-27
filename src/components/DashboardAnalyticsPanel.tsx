import {
  MessageCircle,
  TrendingUp,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import type { ChatSession } from '../types';
import type { DashboardAnalytics } from '../services/posthog-service';

function MiniBarChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className='dash-chart'>
      <div className='dash-chart__bars'>
        {data.map((d, i) => (
          <div key={i} className='dash-chart__col'>
            <div className='dash-chart__bar-wrap'>
              <div
                className='dash-chart__bar'
                style={{ height: `${(d.value / max) * 100}%` }}
              >
                <span className='dash-chart__tooltip'>{d.value}</span>
              </div>
            </div>
            <span className='dash-chart__label'>{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DashboardAnalyticsPanelProps {
  analyticsData: DashboardAnalytics;
  chatSessions: ChatSession[];
  expandedSession: string | null;
  onToggleSession: (sessionId: string | null) => void;
}

export function DashboardAnalyticsPanel({
  analyticsData,
  chatSessions,
  expandedSession,
  onToggleSession,
}: DashboardAnalyticsPanelProps) {
  return (
    <>
      <section className='dash-stats'>
        <div className='dash-stat-card'>
          <div className='dash-stat-card__header'>
            <span className='dash-stat-card__label'>Escaneos hoy</span>
            {analyticsData.stats.scansToday > 0 && (
              <span className='dash-stat-card__trend dash-stat-card__trend--up'>
                Activo
              </span>
            )}
          </div>
          <div className='dash-stat-card__value'>
            {analyticsData.stats.scansToday}
          </div>
          <div className='dash-stat-card__sub'>hoy</div>
        </div>
        <div className='dash-stat-card'>
          <div className='dash-stat-card__header'>
            <span className='dash-stat-card__label'>Esta semana</span>
          </div>
          <div className='dash-stat-card__value'>
            {analyticsData.stats.scansWeek}
          </div>
          <div className='dash-stat-card__sub'>últimos 7 días</div>
        </div>
        <div className='dash-stat-card'>
          <div className='dash-stat-card__header'>
            <span className='dash-stat-card__label'>Total histórico</span>
            <Users size={16} className='dash-stat-card__icon' />
          </div>
          <div className='dash-stat-card__value'>
            {analyticsData.stats.scansTotal.toLocaleString()}
          </div>
          <div className='dash-stat-card__sub'>desde la creación</div>
        </div>
      </section>

      <section className='dash-grid'>
        <div className='dash-card'>
          <div className='dash-card__header'>
            <h3>
              <TrendingUp size={18} />
              Escaneos últimos 7 días
            </h3>
          </div>
          <MiniBarChart data={analyticsData.dailyScans} />
        </div>

        <div className='dash-card'>
          <div className='dash-card__header'>
            <h3>
              <UtensilsCrossed size={18} />
              Categorías más vistas
            </h3>
          </div>
          {analyticsData.topCategories.length > 0 ? (
            <div className='dash-leaderboard'>
              {analyticsData.topCategories.map((cat, idx) => {
                const maxViews = Math.max(
                  1,
                  analyticsData.topCategories[0].views,
                );
                return (
                  <div key={idx} className='dash-leader-row'>
                    <span className='dash-leader-row__rank'>{idx + 1}</span>
                    <div className='dash-leader-row__info'>
                      <span className='dash-leader-row__name'>{cat.name}</span>
                    </div>
                    <div className='dash-leader-row__bar-wrap'>
                      <div
                        className='dash-leader-row__bar'
                        style={{ width: `${(cat.views / maxViews) * 100}%` }}
                      />
                    </div>
                    <span className='dash-leader-row__views'>{cat.views}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className='dash-leaderboard dash-leaderboard--empty'
              style={{
                textAlign: 'center',
                padding: '2rem 0',
                color: 'var(--text-muted)',
              }}
            >
              <p>Aún no hay categorías vistas.</p>
            </div>
          )}
        </div>
      </section>

      <section className='dash-card dash-card--full'>
        <div className='dash-card__header'>
          <h3>
            <MessageCircle size={18} />
            Conversaciones recientes
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {chatSessions.length > 0
              ? `${chatSessions.length} conversaciones`
              : ''}
          </span>
        </div>
        {chatSessions.length > 0 ? (
          <div className='dash-conversations'>
            {chatSessions.map((session) => {
              const firstUserMsg = session.messages.find(
                (m) => m.role === 'user',
              );
              const isExpanded = expandedSession === session.id;
              const timeAgo = new Date(session.created_at).toLocaleString(
                'es-AR',
                {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              );
              return (
                <div
                  key={session.id}
                  className={`dash-conv-row ${isExpanded ? 'dash-conv-row--expanded' : ''}`}
                >
                  <button
                    className='dash-conv-row__toggle'
                    onClick={() =>
                      onToggleSession(isExpanded ? null : session.id)
                    }
                  >
                    <MessageCircle size={16} className='dash-conv-row__icon' />
                    <span className='dash-conv-row__question'>
                      &ldquo;{firstUserMsg?.content ?? '(sin mensajes)'}&rdquo;
                    </span>
                    <span className='dash-conv-row__meta'>
                      {session.customer_email && (
                        <span className='dash-conv-row__email'>
                          {session.customer_email}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {timeAgo}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className='dash-conv-thread'>
                      {session.messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`dash-conv-msg dash-conv-msg--${msg.role}`}
                        >
                          <span className='dash-conv-msg__label'>
                            {msg.role === 'user' ? '👤 Cliente' : '🤖 Asistente'}
                          </span>
                          <p className='dash-conv-msg__text'>{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className='dash-conversations dash-conversations--empty'
            style={{
              textAlign: 'center',
              padding: '2.5rem 0',
              color: 'var(--text-muted)',
            }}
          >
            <MessageCircle
              size={32}
              style={{ opacity: 0.3, marginBottom: '0.5rem' }}
            />
            <p>Nadie usó el chat todavía.</p>
            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Las conversaciones de tus clientes aparecerán acá.
            </span>
          </div>
        )}
      </section>
    </>
  );
}

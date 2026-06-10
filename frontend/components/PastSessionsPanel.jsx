'use client'

const SESSION_KEY = 'tablefor_session_id'

function SessionListItem({ session, isLoading, onSelect }) {
  const meal = session.session_data?.meal_type
  const dateLabel = session.created_at
    ? new Date(session.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <button
      type="button"
      onClick={() => onSelect(session.session_id)}
      disabled={Boolean(isLoading)}
      className={`w-full text-left px-3.5 py-3 rounded-[16px] border transition-all ${
        isLoading
          ? 'bg-accent/5 border-accent ring-1 ring-accent/20'
          : 'bg-white border-border hover:border-accent hover:shadow-card'
      } disabled:opacity-60`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate">
            {session.group_name || 'Dining session'}
          </p>
          <p className="text-[11px] text-text-secondary mt-1">
            📍 {session.suggested_area || session.session_data?.suggested_area || 'Area TBD'}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {meal && (
              <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-[10px] text-text-secondary capitalize">
                {meal}
              </span>
            )}
            {dateLabel && (
              <span className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-[10px] text-text-secondary">
                {dateLabel}
              </span>
            )}
          </div>
        </div>
        <span className="text-lg font-light text-accent shrink-0 leading-none">
          {isLoading ? '…' : '→'}
        </span>
      </div>
    </button>
  )
}

export default function PastSessionsPanel({
  userSessions = [],
  loadingSessionId,
  onLoadSession,
  onSignIn,
  isSignedIn = false,
  hasLocalSession = false,
}) {
  const localSessionId =
    typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null
  const showLocalSession = hasLocalSession && localSessionId

  return (
    <div className="px-4 py-4 pb-8 md:px-6 lg:px-8">
      <h1 className="text-lg font-bold text-text-primary mb-1">Past sessions</h1>
      <p className="text-[12px] text-text-secondary mb-5">
        Resume a group you started before.
      </p>

      {showLocalSession && (
        <div className="mb-5">
          <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mb-2">
            This device
          </p>
          <SessionListItem
            session={{
              session_id: localSessionId,
              group_name: 'Current session',
              suggested_area: null,
              session_data: {},
            }}
            isLoading={loadingSessionId === localSessionId}
            onSelect={onLoadSession}
          />
        </div>
      )}

      {isSignedIn ? (
        userSessions.length > 0 ? (
          <div>
            <p className="text-[11px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Your account
            </p>
            <div className="space-y-2">
              {userSessions.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  isLoading={loadingSessionId === session.session_id}
                  onSelect={onLoadSession}
                />
              ))}
            </div>
          </div>
        ) : (
          !showLocalSession && (
            <div className="px-4 py-8 text-center bg-white border border-border rounded-[20px] shadow-card">
              <p className="text-sm text-text-secondary">
                No saved sessions yet. Run a search while signed in and it will appear here.
              </p>
            </div>
          )
        )
      ) : (
        <div className="px-4 py-6 bg-white border border-border rounded-[20px] shadow-card text-center">
          <p className="text-sm text-text-secondary mb-4">
            Sign in to sync and access your sessions across devices.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-4 py-2.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded-[14px] transition-colors"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  )
}

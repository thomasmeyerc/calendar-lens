import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthScreenProps {
  onSignIn: () => void;
  onOfflineMode: () => void;
  isConfigured: boolean;
}

export function AuthScreen({ onSignIn, onOfflineMode, isConfigured }: AuthScreenProps) {
  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-hero">
          <div className="auth-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="4" x2="8" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="4" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="14.5" r="1.2" fill="currentColor" />
              <circle cx="12" cy="14.5" r="1.2" fill="currentColor" />
              <circle cx="16" cy="14.5" r="1.2" fill="currentColor" />
              <circle cx="8" cy="18.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="auth-title">Understand how you spend your time</h1>
          <p className="auth-subtitle">Connect your Google Calendar or upload an .ics file to visualize patterns and gain insights.</p>
        </div>

        {isConfigured && <GoogleSignInButton onClick={onSignIn} />}
        {!isConfigured && <p className="auth-hint">Google sign-in not configured. Use offline mode.</p>}

        <div className="auth-divider"><span>or</span></div>

        <button className="btn btn-secondary" onClick={onOfflineMode}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload .ics file instead
        </button>

        <div className="auth-features">
          <div className="auth-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Visualize meeting patterns and time allocation
          </div>
          <div className="auth-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Discover busy hours with an interactive heatmap
          </div>
          <div className="auth-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Your data stays in your browser — nothing is stored
          </div>
        </div>
      </div>
    </div>
  );
}

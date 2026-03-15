import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import type { AuthUser } from '../../hooks/useAuth';

interface NavbarProps {
  user: AuthUser | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpload: () => void;
  onSync: () => void;
}

export function Navbar({ user, isDark, onToggleTheme, onSignIn, onSignOut, onUpload, onSync }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <div className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8" />
            <line x1="8" y1="4" x2="8" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="16" y1="4" x2="16" y2="7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8" cy="14.5" r="1.2" fill="currentColor" />
            <circle cx="12" cy="14.5" r="1.2" fill="currentColor" />
            <circle cx="16" cy="14.5" r="1.2" fill="currentColor" />
            <circle cx="8" cy="18.5" r="1.2" fill="currentColor" />
          </svg>
        </div>
        <span className="nav-title">CalendarLens</span>
      </div>
      <div className="nav-actions">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        {user ? (
          <UserMenu user={user} onSignOut={onSignOut} onUpload={onUpload} onSync={onSync} />
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onSignIn}>Sign in</button>
        )}
      </div>
    </nav>
  );
}

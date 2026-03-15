import { useState, useRef, useEffect } from 'react';
import type { AuthUser } from '../../hooks/useAuth';

interface UserMenuProps {
  user: AuthUser;
  onSignOut: () => void;
  onUpload: () => void;
  onSync: () => void;
}

export function UserMenu({ user, onSignOut, onUpload, onSync }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={onUpload}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Upload</span>
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onSync}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        <span>Sync</span>
      </button>
      <div className="user-avatar-wrapper" ref={wrapperRef}>
        <button
          className="user-avatar-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="User menu"
        >
          {user.avatar ? (
            <img className="user-avatar" src={user.avatar} alt={user.name} />
          ) : (
            <span className="user-avatar-fallback">
              {(user.name || user.email || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        <div className={`user-dropdown${open ? ' open' : ''}`}>
          <div className="user-dropdown-header">
            <span className="user-dropdown-name">{user.name}</span>
            <span className="user-dropdown-email">{user.email}</span>
          </div>
          <div className="user-dropdown-divider" />
          <button className="user-dropdown-item" onClick={() => { setOpen(false); onSignOut(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

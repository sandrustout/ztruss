import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Compass, History, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

export const AuthMenu: React.FC = () => {
  const { user, profile, isGuest, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isGuest || !user) {
    return (
      <Link to="/login">
        <Button variant="primary" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Traveller';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 p-1.5 rounded-pill hover:bg-bg-elevated border border-border transition-colors text-text"
      >
        <div className="w-7 h-7 rounded-full bg-brand-brown text-brand-cream flex items-center justify-center text-xs font-semibold">
          {initial}
        </div>
        <span className="text-xs font-medium max-w-[110px] truncate hidden sm:inline-block">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-card bg-surface border border-border shadow-warm-lg py-1.5 z-50 text-text animate-in fade-in slide-in-from-top-1">
          <div className="px-3.5 py-2 border-b border-border">
            <p className="text-xs font-semibold truncate">{displayName}</p>
            {user.email && (
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            )}
          </div>

          <div className="py-1 text-xs">
            <Link
              to="/trips"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-bg-elevated transition-colors"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>My Trips</span>
            </Link>
            <Link
              to="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-bg-elevated transition-colors"
            >
              <History className="w-4 h-4 text-primary" />
              <span>Past Travels</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-bg-elevated transition-colors"
            >
              <Settings className="w-4 h-4 text-primary" />
              <span>Preferences</span>
            </Link>
          </div>

          <div className="border-t border-border pt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-primary font-medium hover:bg-bg-elevated transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

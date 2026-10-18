import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInAsDemo, error: authError } = useAuthStore();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectPath = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/';

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      setErrorMessage(null);
      await signInWithGoogle();
      navigate(redirectPath);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      setLoadingDemo(true);
      setErrorMessage(null);
      await signInAsDemo();
      navigate(redirectPath);
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo session initialisation failed.');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Explore</span>
      </Link>

      <div className="p-6 sm:p-8 rounded-card bg-surface border border-border shadow-warm-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text tracking-tight">
            Sign in to <span className="text-primary">TripWise</span>
          </h1>
          <p className="text-xs text-text-muted">
            Access your autosaved itineraries, bill history, and travel preferences across devices.
          </p>
        </div>

        {(errorMessage || authError) && (
          <div className="p-3 rounded-input bg-bg border border-primary/30 flex items-start gap-2.5 text-xs text-text">
            <AlertCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>{errorMessage || authError}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Official Google OAuth Sign In */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full gap-3"
            isLoading={loadingGoogle}
            onClick={handleGoogleSignIn}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </Button>

          {/* Local Developer / Offline Evaluation Sign-in */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[11px] text-text-muted uppercase tracking-wider">
                Recruitment / Evaluation Fallback
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full gap-2 text-xs"
              isLoading={loadingDemo}
              onClick={handleDemoSignIn}
            >
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Continue as Sample Evaluator</span>
            </Button>
            <p className="text-[11px] text-text-muted text-center mt-1.5">
              Instant login without external Google credentials (Sample data mode).
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Encrypted JWT token verification & Row Level Security</span>
          </div>
          {!isSupabaseConfigured && (
            <p className="text-[11px] text-primary font-medium">
              Note: Supabase credentials not yet detected in .env. Evaluator mode is enabled.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

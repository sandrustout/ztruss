import React, { useState, useEffect } from 'react';
import { User, Plane, DollarSign, Clock, ShieldAlert, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, deleteAccount, user } = useAuthStore();
  const { addToast } = useToastStore();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [homeAirport, setHomeAirport] = useState(profile?.home_airport || 'MAA');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [preferredDayStart, setPreferredDayStart] = useState(profile?.preferred_day_start || '09:00');
  const [travelStyle, setTravelStyle] = useState<'relaxed' | 'balanced' | 'packed' | 'fast'>(
    profile?.travel_style || 'balanced'
  );
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(profile?.dietary_prefs || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHomeAirport(profile.home_airport || 'MAA');
      setCurrency(profile.currency || 'INR');
      setPreferredDayStart(profile.preferred_day_start || '09:00');
      setTravelStyle(profile.travel_style || 'balanced');
      setDietaryPrefs(profile.dietary_prefs || []);
    }
  }, [profile]);

  const toggleDietaryPref = (pref: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        home_airport: homeAirport.toUpperCase().trim(),
        currency,
        preferred_day_start: preferredDayStart,
        travel_style: travelStyle,
        dietary_prefs: dietaryPrefs,
      });
      addToast({
        type: 'success',
        message: 'Travel preferences successfully saved.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to update preferences.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      addToast({
        type: 'info',
        message: 'Your account and all associated travel records were deleted.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err.message || 'Account deletion failed. Please retry.',
      });
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Jain', 'Gluten Free'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Travel Preferences & Profile
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Customise default departure airports, currency formatting, pacing, and dietary filters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details Card */}
        <div className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Traveller Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maya Sharma"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text uppercase tracking-wider">
                Email Address
              </label>
              <div className="h-10 px-3 flex items-center text-sm bg-bg-elevated border border-border rounded-input text-text-muted select-none">
                {user?.email || 'Authenticated User'}
              </div>
            </div>
          </div>
        </div>

        {/* Travel & Pricing Defaults */}
        <div className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            <span>Search & Currency Defaults</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Home Airport (IATA)"
              value={homeAirport}
              onChange={(e) => setHomeAirport(e.target.value.toUpperCase())}
              placeholder="MAA"
              maxLength={3}
              helperText="Default departure hub"
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text uppercase tracking-wider">
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-bg border border-border rounded-input text-text focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
              <p className="text-xs text-text-muted">Real-time exchange conversion</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Day Start Time</span>
              </label>
              <input
                type="time"
                value={preferredDayStart}
                onChange={(e) => setPreferredDayStart(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-bg border border-border rounded-input text-text focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="text-xs text-text-muted">Timing engine starting hour</p>
            </div>
          </div>
        </div>

        {/* Travel Style and Dietary Pacing */}
        <div className="p-6 rounded-card bg-surface border border-border shadow-warm space-y-4">
          <h2 className="text-sm font-bold text-text uppercase tracking-wider">
            Itinerary Pacing & Dietary Notes
          </h2>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-text">Preferred Travel Pace</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['relaxed', 'balanced', 'packed', 'fast'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setTravelStyle(style)}
                  className={`p-3 rounded-input border text-xs text-left capitalize transition-colors ${
                    travelStyle === style
                      ? 'bg-primary text-brand-cream border-primary shadow-sm font-semibold'
                      : 'bg-bg text-text border-border hover:bg-bg-elevated'
                  }`}
                >
                  <p className="font-semibold">{style}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {style === 'relaxed'
                      ? 'Fewer stops, long breaks'
                      : style === 'balanced'
                      ? 'Comfortable pacing'
                      : style === 'packed'
                      ? 'Maximum sightseeing'
                      : 'Quick, high-efficiency'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-text">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((opt) => (
                <Chip
                  key={opt}
                  active={dietaryPrefs.includes(opt)}
                  onClick={() => toggleDietaryPref(opt)}
                >
                  {opt}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Save Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" size="md" isLoading={isSaving} className="gap-2">
            <Check className="w-4 h-4" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </form>

      {/* Account Deletion & Privacy Card */}
      <div className="p-6 rounded-card border border-primary/20 bg-bg space-y-3">
        <h3 className="text-sm font-bold text-text flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span>Account & Privacy Governance</span>
        </h3>
        <p className="text-xs text-text-muted leading-relaxed">
          Under our privacy policy (Section 17.8), you may erase your profile, travel history, and cached preferences permanently at any time.
        </p>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-primary hover:text-brand-cream hover:bg-primary"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Account & Data</span>
          </Button>
        ) : (
          <div className="p-4 rounded-input bg-surface border border-primary/40 space-y-3 animate-in fade-in">
            <p className="text-xs font-semibold text-text">
              Are you sure? This will permanently delete your trips, bills, and profile records.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteAccount}
              >
                Yes, Permanently Delete
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

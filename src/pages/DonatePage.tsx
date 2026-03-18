import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FoodType = 'veg' | 'non-veg' | 'packaged';
type DistributionType = 'direct-pickup' | 'ngo-delivery' | 'volunteer-delivery';
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
type ExpiryUrgency = 'urgent' | 'medium' | 'safe' | null;

interface FormData {
  description: string;
  quantity: string;
  foodType: FoodType | null;
  distributionType: DistributionType | null;
  expiryTime: string;
  location: string;
  lat: number | null;
  lng: number | null;
}

interface FormErrors {
  description?: string;
  quantity?: string;
  foodType?: string;
  distributionType?: string;
  expiryTime?: string;
  location?: string;
}

interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const FOOD_TYPES: {
  value: FoodType;
  label: string;
  emoji: string;
  accent: string;
}[] = [
  { value: 'veg', label: 'Vegetarian', emoji: '🥦', accent: 'emerald' },
  { value: 'non-veg', label: 'Non-Veg', emoji: '🍗', accent: 'rose' },
  { value: 'packaged', label: 'Packaged', emoji: '📦', accent: 'sky' },
];

const DISTRIBUTION_TYPES: {
  value: DistributionType;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  {
    value: 'direct-pickup',
    label: 'Direct Pickup',
    emoji: '🤝',
    desc: 'Recipient collects',
  },
  {
    value: 'ngo-delivery',
    label: 'NGO Delivery',
    emoji: '🏢',
    desc: 'NGO handles logistics',
  },
  {
    value: 'volunteer-delivery',
    label: 'Volunteer',
    emoji: '🚲',
    desc: 'Community volunteer',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function getExpiryUrgency(expiryTime: string): ExpiryUrgency {
  if (!expiryTime) return null;
  const hours = (new Date(expiryTime).getTime() - Date.now()) / 3_600_000;
  if (hours < 0) return null;
  if (hours <= 2) return 'urgent';
  if (hours <= 6) return 'medium';
  return 'safe';
}

function computePriorityScore(
  quantity: number,
  expiryTime: string,
  foodType: FoodType | null
): number {
  if (!quantity && !expiryTime) return 0;
  let score = 0;
  score += Math.min(Math.round(Math.log2(quantity + 1) * 8), 40);
  const urgency = getExpiryUrgency(expiryTime);
  if (urgency === 'urgent') score += 50;
  else if (urgency === 'medium') score += 30;
  else if (urgency === 'safe') score += 10;
  if (foodType === 'veg' || foodType === 'non-veg') score += 10;
  return Math.min(score, 100);
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.description.trim() || data.description.trim().length < 10)
    errors.description = 'Please describe the food (at least 10 characters).';
  const qty = Number(data.quantity);
  if (!data.quantity || isNaN(qty) || qty <= 0)
    errors.quantity = 'Enter a valid positive quantity.';
  else if (qty > 50000)
    errors.quantity = 'Quantity seems unusually large — please verify.';
  if (!data.foodType) errors.foodType = 'Select a food type.';
  if (!data.distributionType)
    errors.distributionType = 'Choose a distribution method.';
  if (!data.expiryTime) {
    errors.expiryTime = 'Expiry time is required.';
  } else if (new Date(data.expiryTime).getTime() <= Date.now()) {
    errors.expiryTime = 'Expiry must be in the future.';
  }
  if (!data.location.trim()) errors.location = 'Location is required.';
  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// Toast Notification
const Toast: React.FC<{ data: ToastData; onClose: () => void }> = ({
  data,
  onClose,
}) => {
  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-destructive text-destructive-foreground',
    info: 'bg-amber-500 text-white',
  }[data.type];
  const icon = { success: '✓', error: '✕', info: 'ℹ' }[data.type];
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-right-5 fade-in duration-300 ${styles}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
        {icon}
      </span>
      <span>{data.message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="ml-1 rounded opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ×
      </button>
    </div>
  );
};

// Card Section Wrapper
const Card: React.FC<{
  title: string;
  subtitle?: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, icon, children, className = '' }) => (
  <div
    className={`rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${className}`}
  >
    <div className="flex items-start gap-3 border-b border-border px-6 py-4">
      <span className="text-xl leading-none mt-0.5">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="space-y-5 px-6 py-5">{children}</div>
  </div>
);

// Form Field Wrapper
const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}> = ({ label, error, children, required = false }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
    </label>
    {children}
    {error && (
      <p
        className="flex items-center gap-1.5 text-xs font-medium text-destructive"
        role="alert"
      >
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm-.5 2.5h1v3.5h-1V3.5zm0 4.5h1v1h-1V8z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// Base Input
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
>(({ className = '', hasError, ...props }, ref) => (
  <input
    ref={ref}
    className={`
      flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm
      text-foreground placeholder:text-muted-foreground/60
      transition-colors duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background
      disabled:cursor-not-allowed disabled:opacity-50
      ${hasError ? 'border-destructive focus-visible:ring-destructive/40' : 'border-input hover:border-ring/50'}
      ${className}
    `}
    {...props}
  />
));
Input.displayName = 'Input';

// Textarea
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(({ className = '', hasError, ...props }, ref) => (
  <textarea
    ref={ref}
    className={`
      flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2.5 text-sm
      text-foreground placeholder:text-muted-foreground/60
      transition-colors duration-150 resize-none
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background
      disabled:cursor-not-allowed disabled:opacity-50
      ${hasError ? 'border-destructive focus-visible:ring-destructive/40' : 'border-input hover:border-ring/50'}
      ${className}
    `}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

// Food Type Chip Button
const FoodTypeChip: React.FC<{
  value: FoodType;
  label: string;
  emoji: string;
  accent: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, emoji, accent, selected, disabled, onClick }) => {
  const accentClasses: Record<string, { active: string; ring: string }> = {
    emerald: {
      active:
        'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      ring: 'ring-emerald-500/30',
    },
    rose: {
      active: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
      ring: 'ring-rose-500/30',
    },
    sky: {
      active: 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400',
      ring: 'ring-sky-500/30',
    },
  };
  const { active, ring } = accentClasses[accent];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 px-2
        text-xs font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:cursor-not-allowed disabled:opacity-50
        ${
          selected
            ? `${active} ring-2 ${ring} shadow-sm`
            : 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }
      `}
      aria-pressed={selected}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span>{label}</span>
    </button>
  );
};

// Distribution Method Card
const DistCard: React.FC<{
  value: DistributionType;
  label: string;
  emoji: string;
  desc: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, emoji, desc, selected, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-pressed={selected}
    className={`
      flex flex-1 flex-col items-center gap-1 rounded-xl border p-4
      text-center transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      disabled:cursor-not-allowed disabled:opacity-50
      ${
        selected
          ? 'border-amber-500 bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/25 shadow-sm dark:text-amber-400'
          : 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }
    `}
  >
    <span className="text-2xl leading-none">{emoji}</span>
    <span className="mt-1 text-xs font-bold leading-tight">{label}</span>
    <span className="text-[10px] font-normal opacity-70">{desc}</span>
  </button>
);

// Expiry Urgency Badge
const ExpiryBadge: React.FC<{ urgency: ExpiryUrgency }> = ({ urgency }) => {
  if (!urgency) return null;
  const config = {
    urgent: {
      label: 'Urgent — Act Now',
      desc: 'Expires within 2 hours',
      icon: '🔴',
      cls: 'border-destructive/30 bg-destructive/8 text-destructive dark:text-red-400',
      dot: 'bg-destructive animate-pulse',
    },
    medium: {
      label: 'Moderate Urgency',
      desc: 'Expires within 6 hours',
      icon: '🟡',
      cls: 'border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    safe: {
      label: 'Safe Window',
      desc: 'More than 6 hours remaining',
      icon: '🟢',
      cls: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400',
      dot: 'bg-emerald-500',
    },
  }[urgency];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-300 ${config.cls}`}
      role="status"
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
      <div>
        <span className="font-semibold">
          {config.icon} {config.label}
        </span>
        <span className="ml-2 text-xs font-normal opacity-70">
          {config.desc}
        </span>
      </div>
    </div>
  );
};

// Score Ring
const ScoreDial: React.FC<{ score: number; animated: boolean }> = ({
  score,
  animated,
}) => {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 70
      ? 'var(--score-high)'
      : score >= 40
        ? 'var(--score-mid)'
        : 'var(--score-low)';

  return (
    <>
      <style>{`
        :root {
          --score-high: #ef4444;
          --score-mid: #f59e0b;
          --score-low: #10b981;
        }
      `}</style>
      <div
        className={`relative inline-flex items-center justify-center ${animated ? 'scale-110 transition-transform duration-300' : 'transition-transform duration-300'}`}
      >
        <svg width="92" height="92" className="-rotate-90" aria-hidden="true">
          <circle
            cx="46"
            cy="46"
            r={r}
            fill="none"
            className="stroke-muted"
            strokeWidth="7"
          />
          <circle
            cx="46"
            cy="46"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition:
                'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>
            {score}
          </span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            / 100
          </span>
        </div>
      </div>
    </>
  );
};

// Inline score bar
const ScoreBar: React.FC<{ label: string; value: number; max: number }> = ({
  label,
  value,
  max,
}) => (
  <div className="flex items-center gap-3">
    <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">
      {label}
    </span>
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
        style={{
          width: `${(value / max) * 100}%`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
    <span className="w-9 shrink-0 text-[11px] tabular-nums text-muted-foreground">
      {value}/{max}
    </span>
  </div>
);

// Stat Pill
const StatPill: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-3 py-4 text-center transition-colors hover:bg-accent">
    <span className="text-xl leading-none">{icon}</span>
    <span className="text-base font-bold text-foreground">{value}</span>
    <span className="text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const DonatePage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    description: '',
    quantity: '',
    foodType: null,
    distributionType: null,
    expiryTime: '',
    location: '',
    lat: null,
    lng: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [locationLoading, setLocLoad] = useState(false);
  const [priorityScore, setScore] = useState(0);
  const [expiryUrgency, setUrgency] = useState<ExpiryUrgency>(null);
  const [scoreAnimated, setScoreAnim] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const qty = Number(formData.quantity);
    setScore(computePriorityScore(qty, formData.expiryTime, formData.foodType));
    setUrgency(getExpiryUrgency(formData.expiryTime));
    setScoreAnim(true);
    const t = setTimeout(() => setScoreAnim(false), 350);
    return () => clearTimeout(t);
  }, [formData.quantity, formData.expiryTime, formData.foodType]);

  const showToast = useCallback((message: string, type: ToastData['type']) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported.', 'error');
      return;
    }
    setLocLoad(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = (await res.json()) as { display_name?: string };
          const label =
            data.display_name?.split(',').slice(0, 3).join(', ') ??
            `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setFormData((prev) => ({ ...prev, location: label, lat, lng }));
          setErrors((prev) => ({ ...prev, location: undefined }));
          showToast('📍 Location detected!', 'success');
        } catch {
          setFormData((prev) => ({
            ...prev,
            location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
          }));
          showToast('Location set from GPS coordinates.', 'info');
        } finally {
          setLocLoad(false);
        }
      },
      (err) => {
        setLocLoad(false);
        showToast(`Location error: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      showToast('🔐 Login required to donate.', 'error');
      return;
    }

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Please fix the highlighted errors.', 'error');
      return;
    }

    setStatus('submitting');
    try {
      const qty = Number(formData.quantity);
      const score = computePriorityScore(
        qty,
        formData.expiryTime,
        formData.foodType
      );

      await addDoc(collection(db, 'donations'), {
        description: formData.description.trim(),
        quantity: qty,
        foodType: formData.foodType,
        distributionType: formData.distributionType,
        expiryTime: new Date(formData.expiryTime).toISOString(),
        location: formData.location.trim(),
        ...(formData.lat !== null && { lat: formData.lat }),
        ...(formData.lng !== null && { lng: formData.lng }),
        priorityScore: score,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      setStatus('success');
      showToast(
        '🎉 Donation listed! AI is matching recipients now.',
        'success'
      );

      setTimeout(() => {
        setFormData({
          description: '',
          quantity: '',
          foodType: null,
          distributionType: null,
          expiryTime: '',
          location: '',
          lat: null,
          lng: null,
        });
        setErrors({});
        setScore(0);
        setUrgency(null);
        setStatus('idle');
      }, 1500);
    } catch (err) {
      console.error('[DonatePage]', err);
      setStatus('error');
      showToast('Something went wrong. Please try again.', 'error');
      setStatus('idle');
    }
  };

  const isLoading = status === 'submitting';
  const minExpiry = new Date(Date.now() + 30 * 60_000)
    .toISOString()
    .slice(0, 16);

  const scoreMeta =
    priorityScore >= 70
      ? { label: 'Critical Priority', color: 'text-red-500 dark:text-red-400' }
      : priorityScore >= 40
        ? {
            label: 'Medium Priority',
            color: 'text-amber-500 dark:text-amber-400',
          }
        : priorityScore > 0
          ? {
              label: 'Low Priority',
              color: 'text-emerald-600 dark:text-emerald-400',
            }
          : { label: 'Awaiting input…', color: 'text-muted-foreground' };

  const qtyBreakdown = Math.min(
    Math.round(Math.log2(Number(formData.quantity) + 1) * 8),
    40
  );
  const urgBreakdown =
    expiryUrgency === 'urgent'
      ? 50
      : expiryUrgency === 'medium'
        ? 30
        : expiryUrgency === 'safe'
          ? 10
          : 0;
  const typeBreakdown =
    formData.foodType === 'veg' || formData.foodType === 'non-veg' ? 10 : 0;

  return (
    <div className="min-h-screen bg-background">
      {toast && <Toast data={toast} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="mb-8 space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            FoodBridge · AI Redistribution Platform
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Donate Food,{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Fight Waste
            </span>
          </h1>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            List surplus food in seconds. Our AI matches it with the nearest
            verified recipients automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* ── 1. Food Details ───────────────────────────────────── */}
          <Card
            title="Food Details"
            subtitle="Tell us what you're donating"
            icon="🍱"
          >
            <Field label="Description" error={errors.description} required>
              <Textarea
                value={formData.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="e.g. 30 packs of dal rice, freshly cooked, no allergens…"
                rows={3}
                disabled={isLoading}
                hasError={!!errors.description}
                aria-describedby={errors.description ? 'desc-error' : undefined}
              />
            </Field>

            <Field label="Quantity (servings)" error={errors.quantity} required>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                placeholder="e.g. 25"
                disabled={isLoading}
                hasError={!!errors.quantity}
              />
            </Field>

            <Field label="Food Type" error={errors.foodType} required>
              <div className="flex gap-2.5">
                {FOOD_TYPES.map((ft) => (
                  <FoodTypeChip
                    key={ft.value}
                    {...ft}
                    selected={formData.foodType === ft.value}
                    disabled={isLoading}
                    onClick={() => set('foodType', ft.value)}
                  />
                ))}
              </div>
            </Field>
          </Card>

          {/* ── 2. Distribution Method ────────────────────────────── */}
          <Card
            title="Distribution Method"
            subtitle="How will the food reach recipients?"
            icon="🚚"
          >
            <Field
              label="Choose method"
              error={errors.distributionType}
              required
            >
              <div className="flex gap-2.5">
                {DISTRIBUTION_TYPES.map((dt) => (
                  <DistCard
                    key={dt.value}
                    {...dt}
                    selected={formData.distributionType === dt.value}
                    disabled={isLoading}
                    onClick={() => set('distributionType', dt.value)}
                  />
                ))}
              </div>
            </Field>
          </Card>

          {/* ── 3. Expiry Time ────────────────────────────────────── */}
          <Card
            title="Expiry Time"
            subtitle="Critical for AI urgency matching"
            icon="⏱"
          >
            <Field label="Best before" error={errors.expiryTime} required>
              <Input
                type="datetime-local"
                value={formData.expiryTime}
                min={minExpiry}
                onChange={(e) => set('expiryTime', e.target.value)}
                disabled={isLoading}
                hasError={!!errors.expiryTime}
                style={{ colorScheme: 'inherit' }}
              />
            </Field>
            <ExpiryBadge urgency={expiryUrgency} />
          </Card>

          {/* ── 4. Pickup Location ────────────────────────────────── */}
          <Card
            title="Pickup Location"
            subtitle="Where can recipients collect the food?"
            icon="📍"
          >
            <Field label="Address / Area" error={errors.location} required>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="Enter address or use auto-detect…"
                  disabled={isLoading}
                  hasError={!!errors.location}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLoading || locationLoading}
                  className="
                    inline-flex shrink-0 items-center gap-2 rounded-lg border border-input
                    bg-background px-3 py-2 text-xs font-semibold text-muted-foreground
                    transition-colors hover:bg-accent hover:text-accent-foreground hover:border-ring
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  {locationLoading ? (
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <span>📡</span>
                  )}
                  {locationLoading ? 'Detecting…' : 'Auto-detect'}
                </button>
              </div>
            </Field>
            {formData.lat !== null && formData.lng !== null && (
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <svg
                  className="h-3 w-3 text-emerald-500"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 0a4 4 0 00-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 00-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                </svg>
                <span className="font-mono">
                  {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                </span>
              </p>
            )}
          </Card>

          {/* ── 5. AI Priority Score Widget ───────────────────────── */}
          <div
            className={`
              rounded-xl border transition-all duration-500 overflow-hidden
              ${
                priorityScore >= 70
                  ? 'border-red-500/25 bg-red-500/5'
                  : priorityScore >= 40
                    ? 'border-amber-500/25 bg-amber-500/5'
                    : 'border-border bg-card'
              }
            `}
          >
            {/* Widget header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <span className="text-sm font-semibold text-card-foreground">
                  AI Priority Score
                </span>
              </div>
              <span className={`text-xs font-bold ${scoreMeta.color}`}>
                {scoreMeta.label}
              </span>
            </div>

            {/* Widget body */}
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              {/* Dial */}
              <div className="flex justify-center sm:justify-start">
                <ScoreDial score={priorityScore} animated={scoreAnimated} />
              </div>

              {/* Breakdown bars */}
              <div className="flex flex-1 flex-col gap-2.5">
                <p className="text-xs text-muted-foreground">
                  Calculated from quantity, expiry urgency &amp; food type.
                  Higher scores are matched first.
                </p>
                <ScoreBar label="Quantity" value={qtyBreakdown} max={40} />
                <ScoreBar label="Urgency" value={urgBreakdown} max={50} />
                <ScoreBar label="Type" value={typeBreakdown} max={10} />
              </div>
            </div>
          </div>

          {/* ── Submit Button ─────────────────────────────────────── */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              relative w-full overflow-hidden rounded-xl px-6 py-3.5
              bg-gradient-to-r from-amber-500 to-orange-500
              text-base font-bold text-white tracking-wide
              shadow-md shadow-amber-500/20
              transition-all duration-150
              hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5
              active:translate-y-0 active:shadow-md
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0
            "
          >
            {/* Shimmer overlay */}
            {!isLoading && (
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2.5s linear infinite',
                }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2.5">
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                  Listing donation…
                </>
              ) : status === 'success' ? (
                <>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Donation Listed!
                </>
              ) : (
                '🌱 List My Donation →'
              )}
            </span>
          </button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5">
            {['🔒 Secure', '🤖 AI Matched', '⚡ Real-time'].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold text-muted-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </form>

        {/* ── Stats Strip ─────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <StatPill icon="📦" label="Donations Today" value="1,284" />
          <StatPill icon="🤲" label="People Fed" value="9,420" />
          <StatPill icon="♻️" label="Kg Food Saved" value="3.2T" />
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0 }
          100% { background-position:  200% 0 }
        }
      `}</style>
    </div>
  );
};

export default DonatePage;

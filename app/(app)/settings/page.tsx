/** biome-ignore-all lint/a11y/noStaticElementInteractions: Panel uses divs with onClick for card-style navigation; focus and semantics are handled via role/aria or parent controls. */
'use client';

import {
  Bell,
  Check,
  ChevronRight,
  Loader2,
  Palette,
  Shield,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

function Panel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className='h-px'
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
        }}
      />
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.85)',
  borderRadius: '12px',
  outline: 'none',
  height: '40px',
  padding: '0 12px',
  width: '100%',
  fontSize: '14px',
  transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: '11px',
  fontWeight: 700,
  marginBottom: '6px',
  display: 'block',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className='relative h-6 w-11 shrink-0 rounded-full transition-all duration-200'
      style={{
        background: checked
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: checked ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
      }}
    >
      <span
        className='absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200'
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useCurrentUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase profile
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('full_name, email, department, phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? '');
          setEmail(data.email ?? '');
          setDept(data.department ?? '');
          setPhone(data.phone ?? '');
        }
      });
  }, [user?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: dept.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', user.id);
    if (err) setError(err.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const initial = fullName?.[0]?.toUpperCase() ?? '?';

  return (
    <form onSubmit={handleSave} className='space-y-6'>
      {/* Avatar */}
      <div className='flex items-center gap-4'>
        <div
          className='flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black'
          style={{
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc',
            boxShadow: '0 0 20px rgba(99,102,241,0.2)',
          }}
        >
          {initial}
        </div>
        <div>
          <p className='text-sm font-bold text-white'>{fullName || '—'}</p>
          <p className='text-xs' style={{ color: 'rgba(255,255,255,0.35)' }}>
            {email || user?.email}
          </p>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2'>
        <div>
          <label style={labelStyle} htmlFor='settings-full-name'>
            Full Name
          </label>
          <input
            id='settings-full-name'
            style={inputStyle}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder='Your full name'
            disabled={saving}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor='settings-email'>
            Email
          </label>
          <input
            id='settings-email'
            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
            value={email}
            readOnly
            disabled
            title='Email cannot be changed here'
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor='settings-department'>
            Department
          </label>
          <input
            id='settings-department'
            style={inputStyle}
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder='e.g. IT, HR, Finance'
            disabled={saving}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor='settings-phone'>
            Phone
          </label>
          <input
            id='settings-phone'
            type='tel'
            style={inputStyle}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder='+972-50-000-0000'
            disabled={saving}
          />
        </div>
      </div>

      {error && (
        <div
          className='rounded-xl px-4 py-3 text-sm'
          style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.2)',
            color: '#fca5a5',
          }}
        >
          {error}
        </div>
      )}

      <button
        type='submit'
        disabled={saving}
        className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
        style={{
          background: saved
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
        }}
      >
        {saving ? (
          <Loader2 size={14} className='animate-spin' />
        ) : saved ? (
          <Check size={14} />
        ) : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    newTicket: true,
    ticketUpdated: true,
    ticketClosed: false,
    weeklyDigest: true,
    systemAlerts: true,
    loginAlerts: false,
  });

  const set = (k: keyof typeof prefs) => (v: boolean) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const rows = [
    {
      key: 'newTicket',
      label: 'New ticket assigned',
      desc: 'When a ticket is assigned to you',
    },
    {
      key: 'ticketUpdated',
      label: 'Ticket status changed',
      desc: 'When a ticket you own is updated',
    },
    {
      key: 'ticketClosed',
      label: 'Ticket closed',
      desc: 'When a ticket is resolved',
    },
    {
      key: 'weeklyDigest',
      label: 'Weekly digest',
      desc: 'Summary of activity every Monday',
    },
    {
      key: 'systemAlerts',
      label: 'System health alerts',
      desc: 'Critical service downtimes',
    },
    {
      key: 'loginAlerts',
      label: 'New login detected',
      desc: 'When a login occurs from a new device',
    },
  ] as const;

  return (
    <div className='space-y-2'>
      {rows.map(({ key, label, desc }, i) => (
        <div
          key={key}
          className='flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-white/3'
          style={{
            borderBottom:
              i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          <div>
            <p className='text-sm font-medium text-white'>{label}</p>
            <p className='text-xs' style={{ color: 'rgba(255,255,255,0.3)' }}>
              {desc}
            </p>
          </div>
          <Toggle checked={prefs[key]} onChange={set(key)} />
        </div>
      ))}
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      setMsg({ type: 'err', text: 'Passwords do not match.' });
      return;
    }
    if (newPw.length < 8) {
      setMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setMsg({ type: 'err', text: error.message });
    else {
      setMsg({ type: 'ok', text: 'Password updated successfully.' });
      setCurrent('');
      setNewPw('');
      setConfirm('');
    }
    setLoading(false);
  }

  const sessions = [
    {
      device: 'Chrome on Windows',
      location: 'Tel Aviv, IL',
      time: 'Now (current)',
      current: true,
    },
    {
      device: 'Firefox on macOS',
      location: 'Tel Aviv, IL',
      time: '2 days ago',
      current: false,
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Change password */}
      <div>
        <p className='mb-4 text-sm font-bold text-white'>Change Password</p>
        <form onSubmit={handleChangePassword} className='space-y-4'>
          <div>
            <label style={labelStyle} htmlFor='settings-current-password'>
              Current Password
            </label>
            <input
              id='settings-current-password'
              type='password'
              style={inputStyle}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder='••••••••'
              autoComplete='current-password'
            />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <label style={labelStyle} htmlFor='settings-new-password'>
                New Password
              </label>
              <input
                id='settings-new-password'
                type='password'
                style={inputStyle}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder='Min. 8 characters'
                autoComplete='new-password'
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor='settings-confirm-password'>
                Confirm Password
              </label>
              <input
                id='settings-confirm-password'
                type='password'
                style={inputStyle}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder='Repeat new password'
                autoComplete='new-password'
              />
            </div>
          </div>
          {msg && (
            <div
              className='rounded-xl px-4 py-3 text-sm'
              style={
                msg.type === 'ok'
                  ? {
                      background: 'rgba(74,222,128,0.1)',
                      border: '1px solid rgba(74,222,128,0.2)',
                      color: '#86efac',
                    }
                  : {
                      background: 'rgba(244,63,94,0.1)',
                      border: '1px solid rgba(244,63,94,0.2)',
                      color: '#fca5a5',
                    }
              }
            >
              {msg.text}
            </div>
          )}
          <button
            type='submit'
            disabled={loading || !current || !newPw || !confirm}
            className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
          >
            {loading && <Loader2 size={14} className='animate-spin' />}
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Active sessions */}
      <div>
        <p className='mb-3 text-sm font-bold text-white'>Active Sessions</p>
        <div className='space-y-2'>
          {sessions.map((s) => (
            <div
              key={s.device}
              className='flex items-center justify-between rounded-xl px-4 py-3'
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <p
                  className='text-xs font-semibold'
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  {s.device}
                </p>
                <p
                  className='text-[11px]'
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {s.location} · {s.time}
                </p>
              </div>
              {s.current ? (
                <span
                  className='rounded-lg px-2 py-0.5 text-[10px] font-bold'
                  style={{
                    background: 'rgba(74,222,128,0.15)',
                    color: '#4ade80',
                  }}
                >
                  Active
                </span>
              ) : (
                <button
                  type='button'
                  className='rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-red-500/15'
                  style={{ color: '#f87171' }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────
function AppearanceTab() {
  const [accent, setAccent] = useState('#6366f1');
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>(
    'normal',
  );

  const accents = [
    { color: '#6366f1', label: 'Indigo' },
    { color: '#8b5cf6', label: 'Violet' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#22c55e', label: 'Green' },
    { color: '#f59e0b', label: 'Amber' },
  ];

  return (
    <div className='space-y-8'>
      {/* Theme (always dark) */}
      <div>
        <p className='mb-3 text-sm font-bold text-white'>Theme</p>
        <div className='flex gap-3'>
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type='button'
              className='flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-left'
              onClick={() => {}}
            >
              <div
                className='flex h-20 w-32 items-center justify-center rounded-xl'
                style={
                  t === 'dark'
                    ? {
                        background: '#06060f',
                        border: '2px solid rgba(99,102,241,0.6)',
                        boxShadow: '0 0 12px rgba(99,102,241,0.3)',
                      }
                    : {
                        background: '#f8fafc',
                        border: '2px solid rgba(255,255,255,0.08)',
                        opacity: 0.4,
                      }
                }
              >
                {t === 'dark' ? (
                  <span className='text-xs text-white/50'>Dark</span>
                ) : (
                  <span className='text-xs text-black/40'>Light</span>
                )}
              </div>
              <p
                className='text-xs font-semibold capitalize'
                style={{
                  color: t === 'dark' ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
                }}
              >
                {t === 'dark' ? '✓ Dark' : 'Light (soon)'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className='mb-3 text-sm font-bold text-white'>Accent Color</p>
        <div className='flex flex-wrap gap-3'>
          {accents.map(({ color, label }) => (
            <button
              key={color}
              type='button'
              onClick={() => setAccent(color)}
              className='flex flex-col items-center gap-1.5'
              title={label}
            >
              <div
                className='h-8 w-8 rounded-xl transition-all duration-200'
                style={{
                  background: color,
                  boxShadow:
                    accent === color
                      ? `0 0 0 3px rgba(255,255,255,0.15), 0 0 12px ${color}60`
                      : 'none',
                  transform: accent === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
              <span
                className='text-[10px]'
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <p className='mb-3 text-sm font-bold text-white'>Density</p>
        <div className='flex gap-2'>
          {(['compact', 'normal', 'comfortable'] as const).map((d) => (
            <button
              key={d}
              type='button'
              onClick={() => setDensity(d)}
              className='rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-all'
              style={
                density === d
                  ? {
                      background: 'rgba(99,102,241,0.2)',
                      border: '1px solid rgba(99,102,241,0.4)',
                      color: '#a5b4fc',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                    }
              }
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const ActiveTabComponent = {
    profile: ProfileTab,
    notifications: NotificationsTab,
    security: SecurityTab,
    appearance: AppearanceTab,
  }[activeTab];

  return (
    <div
      className='relative min-h-screen space-y-6 p-8'
      style={{ background: '#06060f' }}
    >
      {/* Ambient */}
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '30vw',
            height: '30vw',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className='relative' style={{ zIndex: 1 }}>
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Configuration
          </p>
          <h1
            className='text-4xl font-black tracking-tight'
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.4))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            Manage your account and preferences.
          </p>
        </div>

        <div className='flex gap-6 flex-col lg:flex-row'>
          {/* Sidebar tabs */}
          <div className='lg:w-56 shrink-0'>
            <Panel>
              <nav className='py-2'>
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type='button'
                    onClick={() => setActiveTab(id)}
                    className='flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition-all'
                    style={
                      activeTab === id
                        ? {
                            background: 'rgba(99,102,241,0.15)',
                            color: '#a5b4fc',
                            borderLeft: '2px solid #6366f1',
                          }
                        : {
                            color: 'rgba(255,255,255,0.45)',
                            borderLeft: '2px solid transparent',
                          }
                    }
                  >
                    <div className='flex items-center gap-3'>
                      <Icon size={14} />
                      {label}
                    </div>
                    {activeTab === id && (
                      <ChevronRight size={12} style={{ color: '#6366f1' }} />
                    )}
                  </button>
                ))}
              </nav>
            </Panel>
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <Panel>
              <div
                className='px-6 py-5'
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className='text-sm font-bold text-white'>
                  {TABS.find((t) => t.id === activeTab)?.label}
                </p>
              </div>
              <div className='p-6'>
                <ActiveTabComponent />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

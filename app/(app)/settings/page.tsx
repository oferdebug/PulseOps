/** biome-ignore-all lint/a11y/noStaticElementInteractions: Panel uses divs with onClick for card-style navigation; focus and semantics are handled via role/aria or parent controls. */
'use client';

import {
  Bell,
  Bot,
  Building2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Palette,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Panel } from '@/components/ui/panel';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDbNotifications } from '@/hooks/useDbNotifications';
import { createClient } from '@/lib/supabase/client';

const inputStyle: React.CSSProperties = {
  background: 'var(--app-surface)',
  border: '1px solid var(--app-border)',
  color: 'var(--app-text-primary)',
  borderRadius: '12px',
  outline: 'none',
  height: '40px',
  padding: '0 12px',
  width: '100%',
  fontSize: '14px',
  transition: 'border-color 0.2s',
};
const labelStyle: React.CSSProperties = {
  color: 'var(--app-text-muted)',
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
      aria-label={`Toggle: ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
      className='relative h-6 w-11 shrink-0 rounded-full transition-all duration-200'
      style={{
        background: checked ? 'var(--app-accent)' : 'var(--app-surface-raised)',
        
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
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        department: dept.trim() || null,
        phone: phone.trim() || null,
      })
      .eq('id', user.id);
    if (err) toast.error(err.message);
    else {
      toast.success('Profile saved');
    }
    setSaving(false);
  }

  const initial = fullName?.[0]?.toUpperCase() ?? '?';

  return (
    <form onSubmit={handleSave} className='space-y-6'>
      {/* Avatar */}
      <div className='flex items-center gap-4'>
        <div
          className='flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold'
          style={{
            background: 'var(--app-nav-active-bg)',
            border: '1px solid var(--app-nav-active-border)',
            color: 'var(--app-nav-active-text)',
          }}
        >
          {initial}
        </div>
        <div>
          <p
            className='text-sm font-bold'
            style={{ color: 'var(--app-text-primary)' }}
          >
            {fullName || '—'}
          </p>
          <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
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

      <button
        type='submit'
        disabled={saving}
        className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
        style={{
          background: 'var(--app-accent)',
          color: 'var(--primary-foreground)',
        }}
      >
        {saving && <Loader2 size={14} className='animate-spin' />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const { user } = useCurrentUser();
  const {
    preferences,
    updatePreferences,
    loading: prefsLoading,
  } = useDbNotifications(user?.id);

  const rows = [
    {
      key: 'ticket_created' as const,
      label: 'New ticket created',
      desc: 'When a new ticket is created in your organization',
    },
    {
      key: 'ticket_updated' as const,
      label: 'Ticket status changed',
      desc: 'When a ticket you own is updated',
    },
    {
      key: 'ticket_closed' as const,
      label: 'Ticket closed',
      desc: 'When a ticket is resolved',
    },
    {
      key: 'ticket_assigned' as const,
      label: 'Ticket assigned',
      desc: 'When a ticket is assigned to you',
    },
    {
      key: 'ticket_commented' as const,
      label: 'New comments',
      desc: 'When someone comments on your ticket',
    },
    {
      key: 'sla_breach' as const,
      label: 'SLA breach alerts',
      desc: 'When a ticket approaches or breaches its SLA',
    },
    {
      key: 'mention' as const,
      label: 'Mentions',
      desc: 'When someone mentions you in a comment',
    },
  ];

  if (prefsLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader2
          size={18}
          className='animate-spin'
          style={{ color: 'var(--app-text-faint)' }}
        />
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {rows.map(({ key, label, desc }, i) => (
        <div
          key={key}
          className='flex items-center justify-between rounded-md px-4 py-3.5 transition-colors hover:bg-(--app-surface-raised)'
          style={{
            borderBottom:
              i < rows.length - 1 ? '1px solid var(--app-border)' : 'none',
          }}
        >
          <div>
            <p
              className='text-sm font-medium'
              style={{ color: 'var(--app-text-primary)' }}
            >
              {label}
            </p>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              {desc}
            </p>
          </div>
          <Toggle
            checked={preferences[key]}
            onChange={(v) => updatePreferences({ [key]: v })}
          />
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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated successfully.');
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
        <p
          className='mb-4 text-sm font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Change Password
        </p>
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

          <button
            type='submit'
            disabled={loading || !current || !newPw || !confirm}
            className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
            style={{
              background: 'var(--app-accent)',
              color: 'var(--primary-foreground)',
            }}
          >
            {loading && <Loader2 size={14} className='animate-spin' />}
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Active sessions */}
      <div>
        <p
          className='mb-3 text-sm font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Active Sessions
        </p>
        <div className='space-y-2'>
          {sessions.map((s) => (
            <div
              key={s.device}
              className='flex items-center justify-between rounded-md px-4 py-3'
              style={{
                background: 'var(--app-surface)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div>
                <p
                  className='text-xs font-semibold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {s.device}
                </p>
                <p
                  className='text-[11px]'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {s.location} · {s.time}
                </p>
              </div>
              {s.current ? (
                <span
                  className='rounded-lg px-2 py-0.5 text-[10px] font-bold'
                  style={{
                    background:
                      'color-mix(in srgb, var(--app-health-healthy) 15%, transparent)',
                    color: 'var(--app-health-healthy)',
                  }}
                >
                  Active
                </span>
              ) : (
                <button
                  type='button'
                  className='rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-(--app-logout-hover)'
                  style={{ color: 'var(--destructive)' }}
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
  const [accent, setAccent] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('pulseops_accent') ?? '#10b981';
    return '#10b981';
  });
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('pulseops_density') as 'compact' | 'normal' | 'comfortable') ?? 'normal';
    return 'normal';
  });

  useEffect(() => {
    localStorage.setItem('pulseops_accent', accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('pulseops_density', density);
  }, [density]);

  const accents = [
    { color: '#10b981', label: 'Emerald' },
    { color: '#6366f1', label: 'Indigo' },
    { color: '#8b5cf6', label: 'Violet' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#f59e0b', label: 'Amber' },
  ];

  return (
    <div className='space-y-8'>
      {/* Theme (always dark) */}
      <div>
        <p
          className='mb-3 text-sm font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Theme
        </p>
        <div className='flex gap-3'>
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              type='button'
              className='flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-left'
              onClick={() => {}}
            >
              <div
                className='flex h-20 w-32 items-center justify-center rounded-md'
                style={
                  t === 'dark'
                    ? {
                        background: 'var(--app-bg)',
                        border: '2px solid var(--app-accent-border)',
                      }
                    : {
                        background: 'var(--app-surface)',
                        border: '2px solid var(--app-border)',
                        opacity: 0.4,
                      }
                }
              >
                {t === 'dark' ? (
                  <span
                    className='text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Dark
                  </span>
                ) : (
                  <span
                    className='text-xs'
                    style={{ color: 'var(--app-text-faint)' }}
                  >
                    Light
                  </span>
                )}
              </div>
              <p
                className='text-xs font-semibold capitalize'
                style={{
                  color:
                    t === 'dark'
                      ? 'var(--app-accent-text)'
                      : 'var(--app-text-muted)',
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
        <p
          className='mb-3 text-sm font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Accent Color
        </p>
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
                className='h-8 w-8 rounded-md transition-all duration-200'
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
                style={{ color: 'var(--app-text-muted)' }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div>
        <p
          className='mb-3 text-sm font-bold'
          style={{ color: 'var(--app-text-primary)' }}
        >
          Density
        </p>
        <div className='flex gap-2'>
          {(['compact', 'normal', 'comfortable'] as const).map((d) => (
            <button
              key={d}
              type='button'
              onClick={() => setDensity(d)}
              className='rounded-md px-4 py-2 text-xs font-semibold capitalize transition-all'
              style={
                density === d
                  ? {
                      background: 'var(--app-nav-active-bg)',
                      border: '1px solid var(--app-nav-active-border)',
                      color: 'var(--app-nav-active-text)',
                    }
                  : {
                      background: 'var(--app-surface)',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-nav-idle-text)',
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
      className='min-h-screen space-y-6 p-8'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='relative' >
        {/* Header */}
        <div
          className='animate-fade-in-up opacity-0 mb-6'
          style={{ animationFillMode: 'forwards' }}
        >
          <p
            className='mb-1 text-xs font-bold uppercase tracking-widest'
            style={{ color: 'var(--app-text-muted)' }}
          >
            Configuration
          </p>
          <h1 className='text-xl font-bold tracking-tight' style={{ color: 'var(--app-text-primary)' }}>
            Settings
          </h1>
          <p
            className='mt-1 text-sm'
            style={{ color: 'var(--app-text-muted)' }}
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
                            background: 'var(--app-nav-active-bg)',
                            color: 'var(--app-nav-active-text)',
                            borderLeft: '2px solid var(--app-accent)',
                          }
                        : {
                            color: 'var(--app-text-muted)',
                            borderLeft: '2px solid transparent',
                          }
                    }
                  >
                    <div className='flex items-center gap-3'>
                      <Icon size={14} />
                      {label}
                    </div>
                    {activeTab === id && (
                      <ChevronRight
                        size={12}
                        style={{ color: 'var(--app-accent)' }}
                      />
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
                style={{ borderBottom: '1px solid var(--app-border)' }}
              >
                <p
                  className='text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {TABS.find((t) => t.id === activeTab)?.label}
                </p>
              </div>
              <div className='p-6'>
                <ActiveTabComponent />
              </div>
            </Panel>

            {/* Admin Links */}
            <Panel className='mt-6'>
              <div
                className='px-6 py-4'
                style={{ borderBottom: '1px solid var(--app-border)' }}
              >
                <p
                  className='text-sm font-bold'
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  Administration
                </p>
                <p
                  className='text-xs mt-0.5'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  Manage system-wide settings
                </p>
              </div>
              <nav className='py-2'>
                <Link
                  href='/settings/sla'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Clock size={14} />
                    SLA Management
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
                <Link
                  href='/settings/templates'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <FileText size={14} />
                    Ticket Templates
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
                <Link
                  href='/settings/notifications'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Bell size={14} />
                    Notification Preferences
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
                <Link
                  href='/settings/roles'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Shield size={14} />
                    Roles &amp; Permissions
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
                <Link
                  href='/settings/automations'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Bot size={14} />
                    Automations
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
                <Link
                  href='/settings/organization'
                  className='flex w-full items-center justify-between px-6 py-3 text-sm font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  <div className='flex items-center gap-3'>
                    <Building2 size={14} />
                    Organization
                  </div>
                  <ChevronRight
                    size={12}
                    style={{ color: 'var(--app-text-faint)' }}
                  />
                </Link>
              </nav>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are associated with controls via id/aria */
/** biome-ignore-all assist/source/organizeImports: import order kept intentional */
'use client';

import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Shield,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { use, useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'technician' | 'user';
interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  technician: 'Technician',
  user: 'User',
};
const ROLE_ICON: Record<UserRole, React.ElementType> = {
  admin: Shield,
  technician: Wrench,
  user: User,
};
const ROLE_VAR: Record<UserRole, string> = {
  admin: 'var(--app-stat-open)',
  technician: 'var(--app-stat-resolution)',
  user: 'var(--app-stat-users)',
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className='glass-card'>
      <div className='card-accent-line' />
      {children}
    </div>
  );
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editDept, setEditDept] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setProfile(data);
        setLoading(false);
      });
  }, [id]);

  function enterEdit() {
    if (!profile) return;
    setEditName(profile.full_name);
    setEditRole(profile.role);
    setEditDept(profile.department ?? '');
    setEditPhone(profile.phone ?? '');
    setEditActive(profile.is_active);
    setEditing(true);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim(),
        role: editRole,
        department: editDept.trim() || null,
        phone: editPhone.trim() || null,
        is_active: editActive,
      })
      .eq('id', id)
      .select()
      .single();
    if (err) toast.error(err.message);
    else {
      setProfile(data);
      setEditing(false);
      toast.success('User updated');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error: err } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    if (err) {
      toast.error(err.message);
      setDeleting(false);
    } else {
      toast.success('User deleted');
      router.push('/users');
    }
  }

  const isOwnProfile = currentUser?.id === id;
  const roleVar = profile ? ROLE_VAR[profile.role] : 'var(--app-stat-users)';
  const RoleIcon = profile ? ROLE_ICON[profile.role] : User;

  if (loading)
    return (
      <div
        className='flex min-h-screen items-center justify-center'
        style={{ background: 'var(--app-bg)' }}
      >
        <Loader2
          size={28}
          className='animate-spin'
          style={{ color: 'var(--app-accent)' }}
        />
      </div>
    );

  if (error || !profile)
    return (
      <div className='min-h-screen p-8' style={{ background: 'var(--app-bg)' }}>
        <div
          className='rounded-md px-4 py-3 text-sm'
          style={{
            background:
              'color-mix(in srgb, var(--destructive) 12%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
            color: 'var(--destructive)',
          }}
        >
          {error ?? 'User not found.'}
        </div>
      </div>
    );

  return (
    <div
      className='min-h-screen p-8'
      style={{ background: 'var(--app-bg)' }}
    >

      <div
        className='mx-auto max-w-2xl space-y-6'
       
      >
        {/* Nav */}
        <div className='flex items-center justify-between'>
          <AppBreadcrumb current={profile.full_name || profile.email || 'User'} />
          {!editing && (
            <div className='flex gap-2'>
              {isOwnProfile && (
                <button
                  type='button'
                  onClick={enterEdit}
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-surface-raised)'
                  style={{
                    border: '1px solid var(--app-border)',
                    color: 'var(--app-text-secondary)',
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
              {!isOwnProfile && (
                <button
                  type='button'
                  onClick={handleDelete}
                  disabled={deleting}
                  className='flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-logout-hover)'
                  style={{
                    border:
                      '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                    color: 'var(--destructive)',
                  }}
                >
                  {deleting ? (
                    <Loader2 size={12} className='animate-spin' />
                  ) : (
                    <Trash2 size={12} />
                  )}{' '}
                  Delete
                </button>
              )}
            </div>
          )}
          {editing && (
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={handleSave}
                disabled={saving}
                className='flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'var(--app-accent)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {saving ? (
                  <Loader2 size={12} className='animate-spin' />
                ) : (
                  <Check size={12} />
                )}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                type='button'
                onClick={() => setEditing(false)}
                disabled={saving}
                className='flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-all hover:bg-(--app-surface-raised)'
                style={{
                  border: '1px solid var(--app-border)',
                  color: 'var(--app-nav-idle-text)',
                }}
              >
                <X size={12} /> Cancel
              </button>
            </div>
          )}
        </div>

        <Panel>
          <div className='space-y-6 p-6'>
            {/* Avatar + Name */}
            <div className='flex items-center gap-4'>
              <div
                className='flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-2xl font-bold'
                style={{
                  background: `color-mix(in srgb, ${roleVar} 18%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${roleVar} 40%, transparent)`,
                  color: roleVar,
                  boxShadow: `0 0 20px color-mix(in srgb, ${roleVar} 20%, transparent)`,
                }}
              >
                {profile.full_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className='min-w-0 flex-1'>
                {editing ? (
                  <input
                    style={{ ...inputStyle, fontSize: '18px', fontWeight: 800 }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <h1
                    className='truncate text-2xl font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    {profile.full_name || '—'}
                  </h1>
                )}
                <p
                  className='text-sm'
                  style={{ color: 'var(--app-text-muted)' }}
                >
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Role + Status */}
            <div className='flex flex-wrap items-center gap-2'>
              {editing ? (
                <>
                  <Select
                    value={editRole}
                    onValueChange={(v) => setEditRole(v as UserRole)}
                  >
                    <SelectTrigger
                      className='h-9 w-40 rounded-md text-xs'
                      style={{
                        background: 'var(--app-surface)',
                        border: '1px solid var(--app-border)',
                        color: 'var(--app-text-primary)',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='user'>User</SelectItem>
                      <SelectItem value='technician'>Technician</SelectItem>
                      <SelectItem value='admin'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={editActive ? 'active' : 'inactive'}
                    onValueChange={(v) => setEditActive(v === 'active')}
                  >
                    <SelectTrigger
                      className='h-9 w-32 rounded-md text-xs'
                      style={{
                        background: 'var(--app-surface)',
                        border: '1px solid var(--app-border)',
                        color: 'var(--app-text-primary)',
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='inactive'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <>
                  <span
                    className='flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold capitalize'
                    style={{
                      background: `color-mix(in srgb, ${roleVar} 18%, transparent)`,
                      color: roleVar,
                    }}
                  >
                    <RoleIcon size={11} /> {ROLE_LABELS[profile.role]}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold ${profile.is_active ? 'badge-closed' : ''}`}
                    style={
                      profile.is_active
                        ? undefined
                        : {
                            background:
                              'color-mix(in srgb, var(--app-priority-low) 12%, transparent)',
                            color: 'var(--app-priority-low)',
                          }
                    }
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${profile.is_active ? 'dot-healthy' : ''}`}
                      style={
                        profile.is_active
                          ? undefined
                          : { background: 'var(--app-priority-low)' }
                      }
                    />
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className='text-xs'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    Joined {formatDate(profile.created_at)}
                  </span>
                </>
              )}
            </div>

            {/* Fields */}
            <div
              className='grid gap-4 sm:grid-cols-2'
              style={{
                borderTop: '1px solid var(--app-border)',
                paddingTop: '20px',
              }}
            >
              <div>
                <label htmlFor='department' style={labelStyle}>
                  Department
                </label>
                {editing ? (
                  <input
                    style={inputStyle}
                    placeholder='e.g. IT, HR'
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <p
                    className='text-sm'
                    style={{
                      color: profile.department
                        ? 'var(--app-text-secondary)'
                        : 'var(--app-text-faint)',
                    }}
                  >
                    {profile.department || '—'}
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                {editing ? (
                  <input
                    type='tel'
                    style={inputStyle}
                    placeholder='+972-50-000-0000'
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  <p
                    className='text-sm'
                    style={{
                      color: profile.phone
                        ? 'var(--app-text-secondary)'
                        : 'var(--app-text-faint)',
                    }}
                  >
                    {profile.phone || '—'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

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
const ROLE_COLOR: Record<UserRole, string> = {
  admin: '#f43f5e',
  technician: '#fb923c',
  user: '#818cf8',
};

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className='overflow-hidden rounded-2xl'
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
    if (err) setError(err.message);
    else {
      setProfile(data);
      setEditing(false);
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
      setError(err.message);
      setDeleting(false);
    } else router.push('/users');
  }

  const isOwnProfile = currentUser?.id === id;
  const roleColor = profile ? ROLE_COLOR[profile.role] : '#818cf8';
  const RoleIcon = profile ? ROLE_ICON[profile.role] : User;

  if (loading)
    return (
      <div
        className='flex min-h-screen items-center justify-center'
        style={{ background: '#06060f' }}
      >
        <Loader2
          size={28}
          className='animate-spin'
          style={{ color: '#6366f1' }}
        />
      </div>
    );

  if (error || !profile)
    return (
      <div className='min-h-screen p-8' style={{ background: '#06060f' }}>
        <div
          className='rounded-xl px-4 py-3 text-sm'
          style={{
            background: 'rgba(244,63,94,0.1)',
            border: '1px solid rgba(244,63,94,0.2)',
            color: '#fca5a5',
          }}
        >
          {error ?? 'User not found.'}
        </div>
      </div>
    );

  return (
    <div
      className='relative min-h-screen p-8'
      style={{ background: '#06060f' }}
    >
      <div className='pointer-events-none fixed inset-0' style={{ zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${roleColor}18 0%, transparent 70%)`,
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

      <div
        className='relative mx-auto max-w-2xl space-y-6'
        style={{ zIndex: 1 }}
      >
        {/* Nav */}
        <div className='flex items-center justify-between'>
          <Link
            href='/users'
            className='inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5'
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            <ArrowLeft size={13} /> Back
          </Link>
          {!editing && (
            <div className='flex gap-2'>
              {isOwnProfile && (
                <button
                  type='button'
                  onClick={enterEdit}
                  className='flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5'
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
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
                  className='flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-red-500/10'
                  style={{
                    border: '1px solid rgba(244,63,94,0.2)',
                    color: '#f87171',
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
                className='flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40'
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
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
                className='flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all hover:bg-white/5'
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
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
                className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black'
                style={{
                  background: `${roleColor}20`,
                  border: `1px solid ${roleColor}40`,
                  color: roleColor,
                  boxShadow: `0 0 20px ${roleColor}20`,
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
                  <h1 className='truncate text-2xl font-black text-white'>
                    {profile.full_name || '—'}
                  </h1>
                )}
                <p
                  className='text-sm'
                  style={{ color: 'rgba(255,255,255,0.35)' }}
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
                      className='h-9 w-40 rounded-xl text-xs'
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.8)',
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
                      className='h-9 w-32 rounded-xl text-xs'
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.8)',
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
                    className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold capitalize'
                    style={{ background: `${roleColor}18`, color: roleColor }}
                  >
                    <RoleIcon size={11} /> {ROLE_LABELS[profile.role]}
                  </span>
                  <span
                    className='flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold'
                    style={
                      profile.is_active
                        ? {
                            background: 'rgba(74,222,128,0.12)',
                            color: '#4ade80',
                          }
                        : {
                            background: 'rgba(107,114,128,0.12)',
                            color: '#6b7280',
                          }
                    }
                  >
                    <span
                      className='h-1.5 w-1.5 rounded-full'
                      style={{
                        background: profile.is_active ? '#4ade80' : '#6b7280',
                        boxShadow: profile.is_active
                          ? '0 0 6px #4ade80'
                          : 'none',
                      }}
                    />
                    {profile.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className='text-xs'
                    style={{ color: 'rgba(255,255,255,0.25)' }}
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
                borderTop: '1px solid rgba(255,255,255,0.06)',
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
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.2)',
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
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.2)',
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

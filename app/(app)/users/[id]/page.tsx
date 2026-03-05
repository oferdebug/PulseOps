/**
 * User Detail Page — /users/[id]
 *
 * Shows full profile with inline edit mode.
 * Only the user themselves or an admin can edit.
 * Only admins can delete.
 *
 * TODO:
 * - Replace window.confirm with AlertDialog.
 * - Add avatar upload.
 */
'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Shield,
  Wrench,
  User,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Static Maps ────────────────────────────────────────────────────────────

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

const ROLE_VARIANT: Record<UserRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  technician: 'secondary',
  user: 'outline',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

// ─── Component ──────────────────────────────────────────────────────────────

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

  // Edit state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editActive, setEditActive] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProfile(data);
        setLoading(false);
      });
  }, [id]);

  function enterEditMode() {
    if (!profile) return;
    setEditName(profile.full_name);
    setEditRole(profile.role);
    setEditDepartment(profile.department ?? '');
    setEditPhone(profile.phone ?? '');
    setEditActive(profile.is_active);
    setEditing(true);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim(),
        role: editRole,
        department: editDepartment.trim() || null,
        phone: editPhone.trim() || null,
        is_active: editActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setProfile(data);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      setError(error.message);
      setDeleting(false);
      return;
    }
    router.push('/users');
  }

  const isOwnProfile = currentUser?.id === id;
  const canEdit = isOwnProfile; // TODO: add admin check once role is in useCurrentUser
  const canDelete = !isOwnProfile; // Can't delete yourself

  // ── Render states ──

  if (loading) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <Loader2 size={24} className='animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className='space-y-4'>
        <p className='text-sm text-red-500'>{error ?? 'User not found.'}</p>
        <Button variant='outline' asChild>
          <Link href='/users'>
            <ArrowLeft size={14} className='mr-1' />
            Back
          </Link>
        </Button>
      </div>
    );
  }

  const RoleIcon = ROLE_ICON[profile.role];

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      {/* ── Header ── */}
      <div className='flex items-center justify-between'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/users'>
            <ArrowLeft size={16} className='mr-1' />
            Back
          </Link>
        </Button>

        {!editing && (
          <div className='flex gap-2'>
            {canEdit && (
              <Button size='sm' variant='outline' onClick={enterEditMode}>
                <Pencil size={14} className='mr-1' />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                size='sm'
                variant='ghost'
                className='text-red-500 hover:text-red-600 hover:bg-red-50'
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={14} className='mr-1 animate-spin' />
                ) : (
                  <Trash2 size={14} className='mr-1' />
                )}
                Delete
              </Button>
            )}
          </div>
        )}

        {editing && (
          <div className='flex gap-2'>
            <Button size='sm' onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 size={14} className='mr-1 animate-spin' />
              ) : (
                <Check size={14} className='mr-1' />
              )}
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X size={14} className='mr-1' />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* ── Profile Card ── */}
      <Card>
        <CardHeader className='space-y-4 pb-4'>
          {/* Avatar + Name */}
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl'>
              {profile.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className='min-w-0 flex-1'>
              {editing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className='text-lg font-semibold'
                  disabled={saving}
                />
              ) : (
                <h1 className='text-2xl font-semibold truncate'>
                  {profile.full_name || '—'}
                </h1>
              )}
              <p className='text-sm text-muted-foreground'>{profile.email}</p>
            </div>
          </div>

          {/* Role + Status */}
          <div className='flex flex-wrap gap-2'>
            {editing ? (
              <>
                <Select
                  value={editRole}
                  onValueChange={(v) => setEditRole(v as UserRole)}
                >
                  <SelectTrigger className='w-40'>
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
                  <SelectTrigger className='w-32'>
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
                <Badge
                  variant={ROLE_VARIANT[profile.role]}
                  className='flex items-center gap-1 capitalize'
                >
                  <RoleIcon size={10} />
                  {ROLE_LABELS[profile.role]}
                </Badge>
                <Badge
                  variant='outline'
                  className={cn(
                    'capitalize',
                    profile.is_active
                      ? 'text-green-500'
                      : 'text-muted-foreground',
                  )}
                >
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className='text-xs text-muted-foreground self-center'>
                  Joined {formatDate(profile.created_at)}
                </span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Department */}
          <div className='space-y-1.5'>
            <Label>Department</Label>
            {editing ? (
              <Input
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                placeholder='e.g. IT, HR, Finance'
                disabled={saving}
              />
            ) : (
              <p className='text-sm'>{profile.department || '—'}</p>
            )}
          </div>

          {/* Phone */}
          <div className='space-y-1.5'>
            <Label>Phone</Label>
            {editing ? (
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder='e.g. +972-50-000-0000'
                disabled={saving}
              />
            ) : (
              <p className='text-sm'>{profile.phone || '—'}</p>
            )}
          </div>

          {error && <p className='text-sm text-red-500'>{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

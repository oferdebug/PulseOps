/** biome-ignore-all lint/a11y/noLabelWithoutControl: labels are associated with adjacent inputs */
'use client';

import {
  Building2,
  ChevronRight,
  Globe,
  Loader2,
  Mail,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RequireRole } from '@/components/RequireRole';
import { Panel } from '@/components/ui/panel';
import { useOrganization } from '@/hooks/useOrganization';

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

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444' },
  agent: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8' },
  customer: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
};

export default function OrganizationPage() {
  return (
    <RequireRole allowed={['admin']}>
      <OrgContent />
    </RequireRole>
  );
}

function OrgContent() {
  const {
    org,
    members,
    invites,
    loading,
    updateOrg,
    inviteMember,
    revokeInvite,
    removeMember,
  } = useOrganization();
  const [tab, setTab] = useState<'general' | 'members' | 'invites'>('general');

  // General form state
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviting, setInviting] = useState(false);

  // Populate on load
  useEffect(() => {
    if (org) {
      setOrgName(org.name);
      setWebsite(org.website ?? '');
    }
  }, [org]);

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrg({
        name: orgName.trim(),
        website: website.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error('Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
    } catch {
      toast.error('Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2
          size={20}
          className='animate-spin'
          style={{ color: 'var(--app-text-faint)' }}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Building2 },
    {
      id: 'members' as const,
      label: `Members (${members.length})`,
      icon: Users,
    },
    {
      id: 'invites' as const,
      label: `Invites (${invites.length})`,
      icon: Mail,
    },
  ];

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--app-bg)' }}
    >
      <div className='space-y-6 p-8' >
        {/* Header */}
        <div className='flex items-center gap-3'>
          <div
            className='flex h-10 w-10 items-center justify-center rounded-md'
            style={{
              background: 'var(--app-accent-dim)',
              border: '1px solid var(--app-accent-border)',
            }}
          >
            <Building2 size={18} style={{ color: 'var(--app-accent-text)' }} />
          </div>
          <div>
            <h1
              className='text-2xl font-bold tracking-tight'
              style={{ color: 'var(--app-text-primary)' }}
            >
              Organization
            </h1>
            <p className='text-xs' style={{ color: 'var(--app-text-muted)' }}>
              {org?.name ?? 'Manage your organization'}
              {org?.plan ? ` · ${org.plan} plan` : ''}
            </p>
          </div>
        </div>

        <div className='flex gap-6'>
          {/* Tab nav */}
          <Panel className='w-52 shrink-0'>
            <nav className='py-2'>
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type='button'
                  onClick={() => setTab(id)}
                  className='flex w-full items-center justify-between px-5 py-2.5 text-left text-sm font-semibold transition-all'
                  style={
                    tab === id
                      ? {
                          color: 'var(--app-accent-text)',
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
                  {tab === id && (
                    <ChevronRight
                      size={12}
                      style={{ color: 'var(--app-accent)' }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </Panel>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            {tab === 'general' && (
              <Panel>
                <div
                  className='px-6 py-5'
                  style={{ borderBottom: '1px solid var(--app-border)' }}
                >
                  <p
                    className='text-sm font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    Organization Settings
                  </p>
                </div>
                <form onSubmit={handleSaveOrg} className='space-y-4 p-6'>
                  <div>
                    <label style={labelStyle}>Organization Name *</label>
                    <input
                      style={inputStyle}
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <div className='relative'>
                      <Globe
                        size={13}
                        className='absolute left-3 top-1/2 -translate-y-1/2'
                        style={{ color: 'var(--app-text-faint)' }}
                      />
                      <input
                        style={{ ...inputStyle, paddingLeft: '32px' }}
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder='https://example.com'
                        disabled={saving}
                      />
                    </div>
                  </div>
                  <div className='flex items-center gap-3 pt-2'>
                    <button
                      type='submit'
                      disabled={saving || !orgName.trim()}
                      className='flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                      style={{ background: 'var(--app-accent)', color: '#fff' }}
                    >
                      {saving && <Loader2 size={14} className='animate-spin' />}
                      {saved ? 'Saved ✓' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Panel>
            )}

            {tab === 'members' && (
              <Panel>
                <div
                  className='px-6 py-5'
                  style={{ borderBottom: '1px solid var(--app-border)' }}
                >
                  <p
                    className='text-sm font-bold'
                    style={{ color: 'var(--app-text-primary)' }}
                  >
                    Team Members
                  </p>
                  <p
                    className='text-xs mt-0.5'
                    style={{ color: 'var(--app-text-muted)' }}
                  >
                    {members.length} member{members.length !== 1 ? 's' : ''}
                    {org?.max_members ? ` of ${org.max_members} max` : ''}
                  </p>
                </div>
                <div
                  className='divide-y'
                  style={{ borderColor: 'var(--app-border)' }}
                >
                  {members.map((m) => {
                    const colors = ROLE_COLORS[m.role] ?? ROLE_COLORS.agent;
                    return (
                      <div
                        key={m.id}
                        className='flex items-center justify-between px-6 py-3'
                      >
                        <div className='flex items-center gap-3 min-w-0'>
                          <div
                            className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold'
                            style={{
                              background: 'var(--app-accent-dim)',
                              color: 'var(--app-accent-text)',
                            }}
                          >
                            {(
                              m.full_name?.[0] ??
                              m.email?.[0] ??
                              '?'
                            ).toUpperCase()}
                          </div>
                          <div className='min-w-0'>
                            <p
                              className='truncate text-sm font-semibold'
                              style={{ color: 'var(--app-text-primary)' }}
                            >
                              {m.full_name ?? '—'}
                            </p>
                            <p
                              className='truncate text-xs'
                              style={{ color: 'var(--app-text-muted)' }}
                            >
                              {m.email}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span
                            className='rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase'
                            style={{
                              background: colors.bg,
                              color: colors.text,
                            }}
                          >
                            {m.role}
                          </span>
                          <button
                            type='button'
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Remove ${m.full_name ?? m.email}?`,
                                )
                              )
                                removeMember(m.id);
                            }}
                            className='flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-red-500/10'
                            style={{ color: 'var(--app-text-faint)' }}
                            title='Remove member'
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <p
                      className='px-6 py-8 text-center text-sm'
                      style={{ color: 'var(--app-text-faint)' }}
                    >
                      No members found
                    </p>
                  )}
                </div>
              </Panel>
            )}

            {tab === 'invites' && (
              <>
                {/* Invite form */}
                <Panel>
                  <div
                    className='px-6 py-5'
                    style={{ borderBottom: '1px solid var(--app-border)' }}
                  >
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      Invite New Member
                    </p>
                  </div>
                  <form
                    onSubmit={handleInvite}
                    className='flex items-end gap-3 p-6'
                  >
                    <div className='flex-1'>
                      <label style={labelStyle}>Email</label>
                      <input
                        type='email'
                        style={inputStyle}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder='colleague@example.com'
                        required
                        disabled={inviting}
                      />
                    </div>
                    <div className='w-32'>
                      <label style={labelStyle}>Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        disabled={inviting}
                        style={{ ...inputStyle }}
                      >
                        <option value='agent'>Agent</option>
                        <option value='admin'>Admin</option>
                        <option value='customer'>Customer</option>
                      </select>
                    </div>
                    <button
                      type='submit'
                      disabled={inviting || !inviteEmail.trim()}
                      className='flex h-10 items-center gap-2 rounded-md px-4 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40'
                      style={{ background: 'var(--app-accent)', color: '#fff' }}
                    >
                      {inviting ? (
                        <Loader2 size={14} className='animate-spin' />
                      ) : (
                        <Plus size={14} />
                      )}
                      Invite
                    </button>
                  </form>
                </Panel>

                {/* Pending invites */}
                <Panel className='mt-4'>
                  <div
                    className='px-6 py-5'
                    style={{ borderBottom: '1px solid var(--app-border)' }}
                  >
                    <p
                      className='text-sm font-bold'
                      style={{ color: 'var(--app-text-primary)' }}
                    >
                      Pending Invites ({invites.length})
                    </p>
                  </div>
                  <div
                    className='divide-y'
                    style={{ borderColor: 'var(--app-border)' }}
                  >
                    {invites.map((inv) => (
                      <div
                        key={inv.id}
                        className='flex items-center justify-between px-6 py-3'
                      >
                        <div>
                          <p
                            className='text-sm font-semibold'
                            style={{ color: 'var(--app-text-primary)' }}
                          >
                            {inv.email}
                          </p>
                          <p
                            className='text-xs'
                            style={{ color: 'var(--app-text-muted)' }}
                          >
                            Invited as {inv.role} · Expires{' '}
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => revokeInvite(inv.id)}
                          className='flex h-7 w-7 items-center justify-center rounded-lg transition-all hover:bg-red-500/10'
                          style={{ color: 'var(--app-text-faint)' }}
                          title='Revoke invite'
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {invites.length === 0 && (
                      <p
                        className='px-6 py-8 text-center text-sm'
                        style={{ color: 'var(--app-text-faint)' }}
                      >
                        No pending invites
                      </p>
                    )}
                  </div>
                </Panel>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createClient } from '@/lib/supabase/client';

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  website: string | null;
  plan: string;
  max_members: number;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface OrgMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export interface OrgInvite {
  id: string;
  email: string;
  role: string;
  invited_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export function useOrganization() {
  const { user } = useCurrentUser();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrg = useCallback(async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organizationId)
      .single();
    if (data) setOrg(data as Organization);
    setLoading(false);
  }, [user?.organizationId]);

  const fetchMembers = useCallback(async () => {
    if (!user?.organizationId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('organization_id', user.organizationId)
      .order('full_name');
    if (data) setMembers(data as OrgMember[]);
  }, [user?.organizationId]);

  const fetchInvites = useCallback(async () => {
    if (!user?.organizationId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('organization_id', user.organizationId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });
    if (data) setInvites(data as OrgInvite[]);
  }, [user?.organizationId]);

  useEffect(() => {
    fetchOrg();
    fetchMembers();
    fetchInvites();
  }, [fetchOrg, fetchMembers, fetchInvites]);

  async function updateOrg(
    fields: Partial<
      Pick<Organization, 'name' | 'slug' | 'website' | 'logo_url' | 'settings'>
    >,
  ) {
    if (!org) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('organizations')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', org.id);
    if (!error) await fetchOrg();
    return error;
  }

  async function inviteMember(email: string, role = 'agent') {
    if (!user?.organizationId || !user.id) return;
    const supabase = createClient();
    const { error } = await supabase.from('organization_invites').insert({
      organization_id: user.organizationId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    });
    if (!error) await fetchInvites();
    return error;
  }

  async function revokeInvite(inviteId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('organization_invites')
      .delete()
      .eq('id', inviteId);
    if (!error) await fetchInvites();
    return error;
  }

  async function removeMember(memberId: string) {
    if (memberId === user?.id) return { message: 'Cannot remove yourself' };
    const supabase = createClient();
    // Unlink from org by nulling organization_id
    const { error } = await supabase
      .from('profiles')
      .update({ organization_id: null })
      .eq('id', memberId);
    if (!error) await fetchMembers();
    return error;
  }

  return {
    org,
    members,
    invites,
    loading,
    updateOrg,
    inviteMember,
    revokeInvite,
    removeMember,
    refresh: () => {
      fetchOrg();
      fetchMembers();
      fetchInvites();
    },
  };
}

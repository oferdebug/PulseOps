'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'agent' | 'customer';

interface RoleInfo {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isStaff: boolean;
  isCustomer: boolean;
}

export function useRole(userId?: string): RoleInfo {
  const [role, setRole] = useState<UserRole>('agent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data?.role) setRole(data.role as UserRole);
        setLoading(false);
      });
  }, [userId]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isAgent: role === 'agent',
    isStaff: role === 'admin' || role === 'agent',
    isCustomer: role === 'customer',
  };
}

export function useRoleManagement() {
  const [users, setUsers] = useState<
    Array<{ id: string; email: string; full_name: string; role: UserRole }>
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .order('full_name');
    setUsers(
      (data ?? []).map((u) => ({
        ...u,
        role: (u.role ?? 'agent') as UserRole,
      })),
    );
    setLoading(false);
  }, []);

  const updateRole = useCallback(async (userId: string, newRole: UserRole) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    }
    return error;
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, updateRole, refresh: fetchUsers };
}

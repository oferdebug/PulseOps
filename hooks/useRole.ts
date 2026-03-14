'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type UserRole = 'admin' | 'agent' | 'customer';

export function useRole(userId?: string) {
  const [role, setRole] = useState<UserRole>('agent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data, error: queryErr }) => {
        if (queryErr) {
          setError(new Error(queryErr.message));
        } else {
          if (data?.role) setRole(data.role as UserRole);
          setError(null);
        }
        setLoading(false);
      });
  }, [userId]);

  return {
    role,
    loading,
    error,
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

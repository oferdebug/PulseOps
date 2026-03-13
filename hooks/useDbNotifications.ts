'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface DbNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  ticket_id: string | null;
  ticket_title: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  ticket_created: boolean;
  ticket_updated: boolean;
  ticket_closed: boolean;
  ticket_assigned: boolean;
  ticket_commented: boolean;
  sla_breach: boolean;
  mention: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  ticket_created: true,
  ticket_updated: true,
  ticket_closed: true,
  ticket_assigned: true,
  ticket_commented: true,
  sla_breach: true,
  mention: true,
};

export function useDbNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFS);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
    setLoading(false);
  }, [userId]);

  const fetchPreferences = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      setPreferences({
        ticket_created: data.ticket_created,
        ticket_updated: data.ticket_updated,
        ticket_closed: data.ticket_closed,
        ticket_assigned: data.ticket_assigned,
        ticket_commented: data.ticket_commented,
        sla_breach: data.sla_breach,
        mention: data.mention,
      });
    }
  }, [userId]);

  const updatePreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!userId) return;
      const supabase = createClient();
      const newPrefs = { ...preferences, ...prefs };
      setPreferences(newPrefs);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ user_id: userId, ...newPrefs }, { onConflict: 'user_id' });

      if (error) {
        setPreferences(preferences);
      }
    },
    [userId, preferences],
  );

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) {
        console.error('Failed to mark notification as read:', error);
        return;
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    },
    [userId],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) {
      console.error('Failed to mark all as read:', error);
      return;
    }
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? new Date().toISOString(),
      })),
    );
  }, [userId]);

  const deleteNotification = useCallback(
    async (id: string) => {
      if (!userId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Failed to delete notification:', error);
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [userId],
  );

  const clearAll = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) {
      console.error('Failed to clear all notifications:', error);
      return;
    }
    setNotifications([]);
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`db-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as DbNotification;
          setNotifications((prev) => [n, ...prev].slice(0, 50));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return {
    notifications,
    loading,
    unreadCount,
    preferences,
    updatePreferences,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  };
}

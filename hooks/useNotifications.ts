'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type NotificationType = 'created' | 'updated' | 'closed' | 'assigned';

export interface Notification {
  [x: string]: unknown;
  id: string;
  type: NotificationType;
  ticketId: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  link: string;
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderRadius: string;
  borderWidth: string;
  borderStyle: string;
  ticketTitle: string;
}

const STORAGE_KEY = 'pulseops_notifications';
const MAX_NOTIFICATIONS = 20;

type StoredNotification = Notification & { description?: string };

interface TicketRealtimeRow {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
}

function getStorageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

function loadFromStorage(storageKey: string): Notification[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredNotification[];
    return parsed
      .map((notification) => ({
        ...notification,
        message: notification.message ?? notification.description ?? '',
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
}

function saveToStorage(
  storageKey: string,
  notifications: Notification[],
): Notification[] {
  try {
    const sorted = [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const limited = sorted.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(storageKey, JSON.stringify(limited));
    return limited;
  } catch {
    console.error('Failed to save notifications to storage');
    return notifications;
  }
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_STYLES: Pick<
  Notification,
  | 'icon'
  | 'color'
  | 'backgroundColor'
  | 'borderColor'
  | 'textColor'
  | 'borderRadius'
  | 'borderWidth'
  | 'borderStyle'
> = {
  icon: 'Bell',
  color: 'currentColor',
  backgroundColor: 'transparent',
  borderColor: 'currentColor',
  textColor: 'currentColor',
  borderRadius: '0.25rem',
  borderWidth: '1px',
  borderStyle: 'solid',
};

type AddNotificationInput = Pick<
  Notification,
  'type' | 'ticketId' | 'ticketTitle' | 'title' | 'message' | 'link'
>;

function buildNotification(n: AddNotificationInput): Notification {
  return {
    ...DEFAULT_STYLES,
    ...n,
    id: generateId(),
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevDataRef = useRef<
    Record<string, { status: string; assigned_to: string | null }>
  >({});
  const storageKey = userId ? getStorageKey(userId) : null;

  useEffect(() => {
    prevDataRef.current = {};
    if (!storageKey) {
      setNotifications([]);
      return;
    }
    setNotifications(loadFromStorage(storageKey));
  }, [storageKey]);

  const addNotification = useCallback(
    (n: AddNotificationInput) => {
      if (!storageKey) return;
      setNotifications((prev) => {
        const next = [buildNotification(n), ...prev].slice(0, MAX_NOTIFICATIONS);
        return saveToStorage(storageKey, next);
      });
    },
    [storageKey],
  );

  const markRead = useCallback(
    (id: string) => {
      if (!storageKey) return;
      setNotifications((prev) => {
        const next = prev.map((n) =>
          n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
        );
        return saveToStorage(storageKey, next);
      });
    },
    [storageKey],
  );

  const markAllRead = useCallback(() => {
    if (!storageKey) return;
    setNotifications((prev) => {
      const next = prev.map((n) => ({
        ...n,
        readAt: new Date().toISOString(),
      }));
      return saveToStorage(storageKey, next);
    });
  }, [storageKey]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`tickets-realtime:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const ticket = payload.new as TicketRealtimeRow;
            prevDataRef.current[ticket.id] = {
              status: ticket.status,
              assigned_to: ticket.assigned_to,
            };
            addNotification({
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              title: 'New ticket',
              message: `New Ticket Created: ${ticket.title}`,
              link: `/tickets/${ticket.id}`,
              type: 'created',
            });
          }

          if (payload.eventType === 'UPDATE') {
            const next = payload.new as TicketRealtimeRow;
            const prevFromPayload = payload.old as Partial<TicketRealtimeRow>;
            const prev = {
              status:
                prevFromPayload.status ??
                prevDataRef.current[next.id]?.status ??
                next.status,
              assigned_to:
                prevFromPayload.assigned_to ??
                prevDataRef.current[next.id]?.assigned_to ??
                next.assigned_to,
            };

            if (next.status === 'closed' && prev.status !== 'closed') {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket closed',
                message: `Ticket closed: ${next.title}`,
                link: `/tickets/${next.id}`,
                type: 'closed',
              });
            } else if (next.assigned_to !== prev.assigned_to) {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket assigned',
                message: `Ticket assigned: ${next.title}`,
                link: `/tickets/${next.id}`,
                type: 'assigned',
              });
            } else {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket updated',
                message: `Ticket updated: ${next.title}`,
                link: `/tickets/${next.id}`,
                type: 'updated',
              });
            }

            prevDataRef.current[next.id] = {
              status: next.status,
              assigned_to: next.assigned_to,
            };
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, addNotification]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return {
    notifications,
    addNotification,
    markRead,
    markAllRead,
    unreadCount,
  };
}

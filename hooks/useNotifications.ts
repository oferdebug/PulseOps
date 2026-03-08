import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from './useCurrentUser';

export type NotificationType = 'created' | 'updated' | 'closed' | 'assigned';

export interface Notification {
  [x: string]: unknown;
  id: string;
  type: NotificationType;
  ticketId: string;
  title: string;
  description: string;
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
const MAX_NOTAFICTIONS = 20;

function loadFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]): Notification[] {
  try {
    const sorted = [...notifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const limited = sorted.slice(0, MAX_NOTAFICTIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
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
  'type' | 'ticketId' | 'ticketTitle' | 'title' | 'description' | 'link'
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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadFromStorage(),
  );
  const { user } = useCurrentUser();
  const userId = user?.id;
  const prevDataRef = useRef<
    Record<string, { status: string; assigned_to: string | null }>
  >({});

  const addNotification = useCallback((n: AddNotificationInput) => {
    setNotifications((prev) => {
      const next = [buildNotification(n), ...prev].slice(0, MAX_NOTAFICTIONS);
      return saveToStorage(next);
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      );
      return saveToStorage(next);
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({
        ...n,
        readAt: new Date().toISOString(),
      }));
      return saveToStorage(next);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('tickets-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const ticket = payload.new as { id: string; title: string };
            addNotification({
              ticketId: ticket.id,
              ticketTitle: ticket.title,
              title: 'New ticket',
              description: `New Ticket Created: ${ticket.title}`,
              link: `/tickets/${ticket.id}`,
              type: 'created',
            });
          }
          if (payload.eventType === 'UPDATE') {
            const next = payload.new as {
              id: string;
              title: string;
              status: string;
              assigned_to: string | null;
            };
            const prev = prevDataRef.current[next.id];
            if (next.status === 'closed' && prev?.status !== 'closed') {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket closed',
                description: `Ticket closed: ${next.title}`,
                link: `/tickets/${next.id}`,
                type: 'closed',
              });
            } else if (next.assigned_to !== prev?.assigned_to) {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket assigned',
                description: `Ticket assigned: ${next.title}`,
                link: `/tickets/${next.id}`,
                type: 'assigned',
              });
            } else {
              addNotification({
                ticketId: next.id,
                ticketTitle: next.title,
                title: 'Ticket updated',
                description: `Ticket updated: ${next.title}`,
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

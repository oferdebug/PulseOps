import type React from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  LayoutDashboard,
  Settings,
  Shield,
  Ticket,
  Users,
} from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  matchPrefix: boolean;
};

export const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    matchPrefix: false,
  },
  {
    href: '/knowledge-base',
    label: 'Knowledge Base',
    icon: BookOpen,
    matchPrefix: true,
  },
  { href: '/tickets', label: 'Tickets', icon: Ticket, matchPrefix: true },
  { href: '/users', label: 'Users', icon: Users, matchPrefix: true },
  {
    href: '/activity-logs',
    label: 'Activity Logs',
    icon: Activity,
    matchPrefix: true,
  },
  {
    href: '/audit-trail',
    label: 'Audit Trail',
    icon: Shield,
    matchPrefix: true,
  },
  { href: '/reports', label: 'Reports', icon: BarChart3, matchPrefix: true },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: Bell,
    matchPrefix: true,
  },
  { href: '/settings', label: 'Settings', icon: Settings, matchPrefix: true },
] as const;

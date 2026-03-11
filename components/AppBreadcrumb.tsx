'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SEGMENT_LABELS: Record<string, string> = {
  tickets: 'Tickets',
  'knowledge-base': 'Knowledge Base',
  users: 'Users',
  'activity-logs': 'Activity Logs',
  settings: 'Settings',
  dashboard: 'Dashboard',
  new: 'New',
};

interface AppBreadcrumbProps {
  /** Override the last segment label (e.g. ticket title) */
  current?: string;
}

export function AppBreadcrumb({ current }: AppBreadcrumbProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs: { label: string; href: string }[] = [];
  let href = '';
  for (let i = 0; i < segments.length - 1; i++) {
    href += `/${segments[i]}`;
    const label = SEGMENT_LABELS[segments[i]] ?? segments[i];
    crumbs.push({ label, href });
  }

  const lastSegment = segments[segments.length - 1];
  const lastLabel =
    current ?? SEGMENT_LABELS[lastSegment] ?? lastSegment;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{lastLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

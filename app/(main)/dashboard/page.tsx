/**
 * DashboardPage
 *
 * Main overview screen for PulseOps. Displays real-time KPI stats, recent tickets,
 * system health, and quick-action shortcuts.
 *
 * Architecture notes:
 * - StatCard is defined outside this component to prevent React from re-creating
 *   it on every render, which would cause hook-related warnings.
 * - All lookup maps (priorityVariant, statusColor, etc.) and mock data live at
 *   module level — they're static constants with no dependency on component state,
 *   so there's no reason to re-create them on every render.
 * - `invertChange` on StatCard flips the green/red logic for metrics where
 *   a lower number is better (e.g. open tickets, avg resolution time).
 *
 * TODO:
 * - The `getUser()` call is duplicated in AppLayout — extract into a shared
 *   `useCurrentUser()` hook (hooks/useCurrentUser.ts) to stay DRY.
 * - Replace MOCK_* constants with real API calls (/api/dashboard/stats, /api/tickets/recent).
 * - If Quick Actions grows, drive it from a config array + .map() instead of repeating JSX.
 * - Consider moving types to types/dashboard.ts once real data models are introduced.
 */
"use client";

// biome-ignore assist/source/organizeImports: <explanation>
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ticket,
  CheckCircle2,
  Users,
  Clock,
  Plus,
  UserPlus,
  FileText,
  Search,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import {useCurrentUser} from "@/hooks/useCurrentUser";


type Priority = "high" | "medium" | "low";
type TicketStatus = "open" | "in-progress" | "closed";
type HealthStatus = "healthy" | "warning" | "error";


const priorityVariant: Record<
  Priority,
  "destructive" | "default" | "secondary" | "outline"
> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

const statusColor: Record<TicketStatus, string> = {
  open: "text-blue-500",
  "in-progress": "text-yellow-500",
  closed: "text-green-500",
};

const healthColor: Record<HealthStatus, string> = {
  healthy: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
};

const healthDot: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};


const MOCK_STATS = {
  openTickets: 1552,
  closedTickets: 4550,
  totalUsers: 1200,
  avgResolutionHours: 4.5,
  openChange: 50,
  closedChange: 120,
  usersChange: 10,
  resolutionChange: -0.5,
};

const MOCK_RECENT_TICKETS = [
  {
    id: "TK-091",
    title: "VPN not connecting after update",
    user: "Dana Cohen",
    priority: "high" as Priority,
    status: "open" as TicketStatus,
    time: "10m ago",
  },
  {
    id: "TK-090",
    title: "Outlook keeps crashing on startup",
    user: "Avi Levy",
    priority: "medium" as Priority,
    status: "open" as TicketStatus,
    time: "34m ago",
  },
  {
    id: "TK-089",
    title: "New laptop setup required",
    user: "Shira Ben-David",
    priority: "low" as Priority,
    status: "in-progress" as TicketStatus,
    time: "1h ago",
  },
  {
    id: "TK-088",
    title: "Printer offline in room 204",
    user: "Moshe Katz",
    priority: "medium" as Priority,
    status: "in-progress" as TicketStatus,
    time: "2h ago",
  },
  {
    id: "TK-087",
    title: "Password reset request",
    user: "Noa Shapiro",
    priority: "low" as Priority,
    status: "closed" as TicketStatus,
    time: "3h ago",
  },
];

const MOCK_SYSTEM_HEALTH = [
  {
    name: "Active Directory",
    status: "healthy" as HealthStatus,
    uptime: "99.9%",
    latency: "12ms",
  },
  {
    name: "Email Server",
    status: "healthy" as HealthStatus,
    uptime: "99.7%",
    latency: "45ms",
  },
  {
    name: "VPN Gateway",
    status: "warning" as HealthStatus,
    uptime: "97.2%",
    latency: "210ms",
  },
  {
    name: "File Server",
    status: "healthy" as HealthStatus,
    uptime: "100%",
    latency: "8ms",
  },
  {
    name: "Backup Service",
    status: "error" as HealthStatus,
    uptime: "89.1%",
    latency: "—",
  },
];


function StatCard({
  title,
  value,
  change,
  icon: Icon,
  invertChange = false,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  invertChange?: boolean;
}) {
  // "isPositive" = visually good (green), not necessarily numerically positive
  const isPositive = invertChange ? change < 0 : change > 0;
  const isNeutral = change === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <Icon size={16} className="text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          {!isNeutral &&
            (isPositive ? (
              <ArrowUpRight size={12} className="text-green-500" />
            ) : (
              <ArrowDownRight size={12} className="text-red-500" />
            ))}
          <span
            className={cn(
              "text-xs font-medium",
              isNeutral
                ? "text-muted-foreground"
                : isPositive
                  ? "text-green-500"
                  : "text-red-500",
            )}
          >
            {change > 0 ? `+${change}` : change} vs last week
          </span>
        </div>
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const [userName, setUserName] = useState(""); // NOTE: was `setuserName` — fixed casing
  const [greeting, setGreeting] = useState("Good morning");

  // Stored in state (not computed inline) to avoid SSR/client hydration mismatch
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

    const { user } = useCurrentUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          {userName}, {greeting} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in your IT environment, today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value={MOCK_STATS.openTickets}
          change={MOCK_STATS.openChange}
          icon={Ticket}
          invertChange
        />
        <StatCard
          title="Closed Tickets"
          value={MOCK_STATS.closedTickets}
          change={MOCK_STATS.closedChange}
          icon={CheckCircle2}
        />
        <StatCard
          title="Total Users"
          value={MOCK_STATS.totalUsers}
          change={MOCK_STATS.usersChange}
          icon={Users}
        />
        <StatCard
          title="Avg Resolution"
          value={`${MOCK_STATS.avgResolutionHours}h`}
          change={MOCK_STATS.resolutionChange}
          icon={Clock}
          invertChange
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Tickets</CardTitle>
              <CardDescription>
                Latest activity across your helpdesk
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/tickets">View all</a>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_RECENT_TICKETS.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {ticket.id}
                  </span>
                  <span className="truncate font-medium">{ticket.title}</span>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-2">
                  <Badge
                    variant={priorityVariant[ticket.priority]}
                    className="text-xs capitalize"
                  >
                    {ticket.priority}
                  </Badge>
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      statusColor[ticket.status],
                    )}
                  >
                    {ticket.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ticket.time}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
            <CardDescription>Live status of core services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_SYSTEM_HEALTH.map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      healthDot[service.status],
                    )}
                  />
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{service.uptime}</span>
                  <span
                    className={cn("font-medium", healthColor[service.status])}
                  >
                    {service.latency}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks at your fingertips</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button size="sm" asChild>
            <a href="/tickets/new">
              <Plus size={16} className="mr-1" />
              New Ticket
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/users/new">
              <UserPlus size={16} className="mr-1" />
              Add User
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/knowledge-base/new">
              <FileText size={16} className="mr-1" />
              Write Article
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/tickets?status=open">
              <Search size={16} className="mr-1" />
              Search Tickets
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/activity-logs">
              <Activity size={16} className="mr-1" />
              View Logs
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

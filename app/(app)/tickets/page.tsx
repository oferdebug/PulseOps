"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "pending" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";

interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const ALL_STATUS = ["all", "open", "in_progress", "pending", "closed"] as const;
const ALL_PRIORITIES = ["all", "low", "medium", "high", "critical"] as const;

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  pending: "Pending",
  closed: "Closed",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "text-blue-600",
  in_progress: "text-amber-600",
  pending: "text-muted-foreground",
  closed: "text-green-600",
};

const PRIORITY_VARIANT: Record<
  TicketPriority,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "default",
  high: "outline",
  critical: "destructive",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "short" });
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || t.status === status;
    const matchPriority = priority === "all" || t.priority === priority;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className={"space-y-6"}>
      <div className={"flex items-center justify-between"}>
        <div>
          <h1 className={"text-3xl font-semibold"}>Tickets</h1>
          <p className={"text-muted-foreground"}>
            {!loading
              ? `${filtered.length} ticket${filtered.length !== 1 ? "s" : ""} found`
              : "loading..."}
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <Plus size={16} className="mr-1" />
            New Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className={"flex flex-wrap gap-4 pt-6"}>
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder={"search Tickets..."}
              className={"pl-8"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {ALL_STATUS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
                className="capitalize"
              >
                {s === "all" ? "All" : STATUS_LABELS[s as TicketStatus]}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            {ALL_PRIORITIES.map((p) => (
              <Button
                key={p}
                size="sm"
                variant={priority === p ? "default" : "outline"}
                onClick={() => setPriority(p)}
                className="capitalize"
              >
                {p === "all" ? "All" : p}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchTickets()}
            disabled={loading}
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Tickets</CardTitle>
          <CardDescription>Click A Ticket To View Details</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-500">
              Failed to Load Tickets: {error}
            </p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-14 text-muted-foreground">
              <Ticket size={34} className="opacity-30" />
              <p className="text-sm">No Tickets Found</p>
              {(search || status !== "all" || priority !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setPriority("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Ticket rows */}
          {!error &&
            filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm mb-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {ticket.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="truncate font-medium">{ticket.title}</span>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-3">
                  <Badge
                    variant={PRIORITY_VARIANT[ticket.priority]}
                    className="capitalize text-xs"
                  >
                    {ticket.priority}
                  </Badge>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      STATUS_COLORS[ticket.status],
                    )}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </Link>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

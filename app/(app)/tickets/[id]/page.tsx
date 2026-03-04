/**
* Ticket Detail Page — /tickets/[id]
*
* Shows full ticket info and allows changing status (including closing).
* Uses optimistic UI: status updates are reflected immediately in the UI
* before the Supabase call completes, and rolled back on error.
*
* Architecture notes:
    * - `params` is unwrapped with `use()` as required by Next.js 15.
* - Status transition buttons are derived from the current status — only
*   valid "next" statuses are shown to avoid nonsensical transitions.
* - The delete action is guarded by a confirmation dialog (window.confirm
    *   for now; swap for a shadcn AlertDialog in a future polish pass).
*
* TODO:
    * - Add a comments / activity log section below ticket details.
* - Add edit mode for title and description.
* - Replace window.confirm with a proper AlertDialog.
*/
 'use client';
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Loader2,
    Clock,
    User,
    AlertTriangle,
    CheckCircle2,
    CircleDot,
    Hourglass,
    Trash2,
} from "lucide-react";
import Link from "next/link";

type TicketStatus   = "open" | "in_progress" | "pending" | "closed";
type TicketPriority = "low" | "medium" | "high" | "critical";

interface TicketRow {
    user: any;
    id:          string;
    title:       string;
    description: string | null;
    status:      TicketStatus;
    priority:    TicketPriority;
    created_at:  string;
    updated_at:  string;
    assigned_to: string | null;
    created_by:  string | null;
}

// ─── Static Lookup Maps ─────────────────────────────────────────────────────

const STATUS_LABELS: Record<TicketStatus, string> = {
    open:        "Open",
    in_progress: "In Progress",
    pending:     "Pending",
    closed:      "Closed",
};

const STATUS_COLORS: Record<TicketStatus, string> = {
    open:        "text-blue-500",
    in_progress: "text-yellow-500",
    pending:     "text-orange-400",
    closed:      "text-green-500",
};

const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
    open:        CircleDot,
    in_progress: Hourglass,
    pending:     AlertTriangle,
    closed:      CheckCircle2,
};

const PRIORITY_VARIANT: Record<TicketPriority, "destructive" | "default" | "secondary" | "outline"> = {
    critical: "destructive",
    high:     "destructive",
    medium:   "default",
    low:      "secondary",
};

// Valid status transitions — only show meaningful "next" actions
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
    open:        ["in_progress", "pending", "closed"],
    in_progress: ["pending", "closed"],
    pending:     ["in_progress", "closed"],
    closed:      ["open"], // re-open
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
    });
}


export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const {id} = use(params); // Next.js 15: params is a Promise
    const router = useRouter();

    const [ticket, setTicket] = useState<TicketRow | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("tickets")
            .select("*")
            .eq("id", id)
            .single()
            .then(({data, error}) => {
                if (error) setError(error.message);
                else setTicket(data);
                setLoading(false);
            });
    }, [id]);

    async function handleStatusChange(newStatus: TicketStatus) {
        if (!ticket) return;

        // Optimistic update
        const prev = ticket.status;
        setTicket((t) => t ? {...t, status: newStatus} : t);
        setUpdating(true);

        const supabase = createClient();
        const {error} = await supabase
            .from("tickets")
            .update({status: newStatus})
            .eq("id", id);

        if (error) {
            // Roll back on failure
            setTicket((t) => t ? {...t, status: prev} : t);
            setError(error.message);
        }
        setUpdating(false);
    }

    async function handleDelete() {
        if (!window.confirm("Delete this ticket? This action cannot be undone.")) return;

        setDeleting(true);
        const supabase = createClient();
        const {error} = await supabase.from("tickets").delete().eq("id", id);

        if (error) {
            setError(error.message);
            setDeleting(false);
            return;
        }
        router.push("/tickets");
    }

    if (loading) {
        return (
            <div className={'flex h-48 items-center justify-center'}>
                <Loader2 size={26} className={'animate-spin text-muted-foreground'} />
            </div>
        );
    }

    if (error||!ticket) {
        return (
            <div className={'space-y-4'}>
                <p className={'text-sm text-red-500'}>{error??'Ticket Not Found.'}</p>
                <Button variant={'outline'} asChild>
                  <Link href={'/tickets'}><ArrowLeft size={16} className={'mr-2'} /> Back To Tickets </Link>
                </Button>
            </div>
        );
    }

    const StatusIcon=STATUS_ICONS[ticket.status];
    const nextStatus=STATUS_TRANSITIONS[ticket.status];

    return (
        <div className={'mx-auto max-w-2xl space-y-6'}>
            <div className={'flex items-center gap-3.5'}>
                <Button variant={'ghost'} size={'sm'} asChild>
                    <Link href={'/tickets'} className={'text-muted-foreground'}>
                        <ArrowLeft size={16} className={'mr-2'} />
                        Back To Tickets
                    </Link>
                </Button>
            </div>



            <Card>
                <CardHeader className={'space-y-4.5'}>
                    <div className={'flex items-start justify-between gap-6'}>
                        <div className={'space-y-1'}>
                            <p className={'font-mono text-xs text-muted-foreground'}>
                                {ticket.id.slice(0,8).toUpperCase()}
                            </p>
                            <CardTitle className={'text-xl'}>{ticket.title}</CardTitle>
                        </div>
                        <Badge variant={PRIORITY_VARIANT[ticket.priority]} className={'capitalize shrink-0'}>
                            {ticket.priority}
                        </Badge>
                    </div>

                     <div className={cn('flex items-center gap-4 font-medium',STATUS_COLORS[ticket.status])}>
                         <StatusIcon size={16} />
                         {STATUS_LABELS[ticket.status]}
                     </div>

                    <CardDescription className={'flex flex-wrap gap-6 text-xs'}>
                        <span className={'flex items-center gap-2'}>
                            <Clock size={14} />
                            Created {formatDate(ticket.created_at)}
                        </span>
                        <span className={'flex items-center gap-2'}>
                            <User size={14} />
                            {ticket.user.name}
                        </span>

                         <span className={'flex items-center gap-2'}>
                             <Clock size={14} />
                             Updated {formatDate(ticket.updated_at)}
                         </span>
                        {ticket.created_by&&(
                            <span className={'flex items-center gap-2'}>
                                <User size={14} />
                                {ticket.created_by.slice(0, 8)}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {ticket.description? (
                    <p className={'text-sm text-muted-foreground whitespace-pre-wrap'}>{ticket.description}</p>
                    ):(
                        <p className={'text-sm italic text-shadow-muted-foreground'}>No Description Provided,Please Provide  A Valid Description First. </p>
                    )}

                    <div className={'border-t pt-6 space-y-4'}>
                        <p className={'text-xs font-medium text-muted-foreground uppercase tracking-wide'}>
                            Change Status
                        </p>
                        <div className={'flex flex-wrap gap-4'}>
                            {nextStatus.map((status)=>(
                                <Button
                                key={status}
                                size={'sm'}
                                variant={status==='closed'?'outline':'default'}
                                onClick={()=>handleStatusChange(status)}
                                disabled={updating||deleting}
                                className={'capitalize'}
                                >
                                    {updating&&<Loader2 size={14} className={'mr-2 animate-spin'} />}
                                    {status==='closed'?'✓ Close Ticket':STATUS_LABELS[status]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4 flex justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting
                                ? <Loader2 size={14} className="mr-1 animate-spin" />
                                : <Trash2 size={14} className="mr-1" />
                            }
                            Delete Ticket
                        </Button>
                    </div>

                </CardContent>
            </Card>

        </div>
    );
}
             
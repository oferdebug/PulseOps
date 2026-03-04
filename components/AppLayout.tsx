/**
 * AppLayout
 *
 * Root layout wrapper for all authenticated pages. Renders the sidebar,
 * user display, logout button, and the main scrollable content area.
 *
 * Architecture notes:
 * - Nav items are driven from the NAV_ITEMS config array below instead of
 *   repeating JSX per item — easier to add/reorder/remove without touching the component.
 * - `matchPrefix` controls active state: exact match for /dashboard,
 *   startsWith for all section routes (/tickets, /users, etc.).
 * - The `getUser()` call is duplicated in DashboardPage — worth extracting into
 *   a shared `useCurrentUser()` hook (hooks/useCurrentUser.ts) to stay DRY.
 *
 * TODO:
 * - `/Login` route uses a capital L — verify this matches the actual file name.
 *   Next.js routes are case-sensitive on Linux (prod) even if they work on macOS (dev).
 * - Add `aria-label="Sign out"` to the logout button for accessibility.
 * - `max-h-[calc(100vh-4rem)]` on SidebarInset assumes a 4rem top bar — document
 *   or extract this as a layout constant if the structure ever changes.
 */
"use client";

// biome-ignore assist/source/organizeImports: <explanation>
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
} from "./ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Ticket,
  Users,
  Activity,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {createClient} from "@/lib/supabase/client";

// ─── Nav Config ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    matchPrefix: false,
  },
  {
    href: "/knowledge-base",
    label: "Knowledge Base",
    icon: BookOpen,
    matchPrefix: true,
  },
  { href: "/tickets", label: "Tickets", icon: Ticket, matchPrefix: true },
  { href: "/users", label: "Users", icon: Users, matchPrefix: true },
  {
    href: "/activity-logs",
    label: "Activity Logs",
    icon: Activity,
    matchPrefix: true,
  },
  { href: "/settings", label: "Settings", icon: Settings, matchPrefix: true },
];

// ─── Component ─────────────────────────────────────────────────────────────

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("");

const { user } = useCurrentUser();

    async function handleLogout(
    _event: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/Login");
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon, matchPrefix }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      matchPrefix
                        ? pathname.startsWith(href)
                        : pathname === href
                    }
                  >
                    <Link href={href}>
                      <Icon size={18} />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">
                {userName}
              </span>
            </div>
            {/** biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500"
              aria-label={"Sign out"}
            >
              <LogOut size={18} />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="overflow-y-auto max-h-[calc(100vh-4rem)]">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;

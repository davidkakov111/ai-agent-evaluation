"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { MemberRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: MemberRole | null;
    organizationId: string | null;
  };
  children: React.ReactNode;
}

function SidebarContent({
  user,
  navItems,
  pathname,
  onNavigate,
}: {
  user: DashboardShellProps["user"];
  navItems: { href: string; label: string; show: boolean }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 p-2">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
      </nav>
      <Separator />
      <div className="p-4 space-y-2">
        <div className="text-sm">
          <p className="font-medium truncate">{user.name}</p>
          <p className="text-muted-foreground truncate">{user.email}</p>
          {user.role && (
            <p className="text-xs text-muted-foreground mt-1">
              Role: {user.role}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => signOut({ redirectTo: "/login" })}
        >
          Sign Out
        </Button>
      </div>
    </>
  );
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasOrg = !!user.organizationId;

  const navItems = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/dashboard/tasks", label: "Tasks", show: hasOrg },
    { href: "/dashboard/organization", label: "Organization", show: hasOrg },
    { href: "/dashboard/organizations", label: "Browse Orgs", show: !hasOrg },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex h-14 items-center px-4 font-semibold">
          <Link href="/dashboard">TaskFlow</Link>
        </div>
        <Separator />
        <SidebarContent user={user} navItems={navItems} pathname={pathname} />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex md:hidden h-14 items-center gap-3 border-b bg-card px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <SheetTitle className="flex h-14 items-center px-4 font-semibold">
                TaskFlow
              </SheetTitle>
              <Separator />
              <SidebarContent
                user={user}
                navItems={navItems}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">TaskFlow</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

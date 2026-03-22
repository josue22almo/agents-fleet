"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Zap, Bell, Building2, Settings } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard", label: "Metrics", icon: BarChart3, disabled: true },
  { href: "/agents", label: "Agents", icon: Zap },
  { href: "/dashboard", label: "Alarms", icon: Bell, disabled: true },
  { href: "/organizations", label: "Organizations", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <OrgSwitcher />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = !item.disabled && (
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/")
          );
          return (
            <Link
              key={item.label}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                item.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-medium text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </aside>
  );
}

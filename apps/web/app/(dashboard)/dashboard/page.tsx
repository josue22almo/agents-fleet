"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>
      <p className="text-muted-foreground">
        Welcome, {user?.fullName ?? user?.email}
      </p>
    </div>
  );
}

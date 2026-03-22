"use client";

import { useState } from "react";

const TEST_USERS = [
  { email: "alice@test.com", password: "password123", role: "Owner of Acme Corp & Startup Labs" },
  { email: "bob@test.com", password: "password123", role: "Admin of Acme Corp, Member of Startup Labs" },
  { email: "carol@test.com", password: "password123", role: "Member of Acme Corp" },
  { email: "dave@test.com", password: "password123", role: "Pending invite to Acme Corp" },
];

export function DevToolbar() {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 flex items-center gap-2 text-sm font-semibold"
      >
        Show Test Users
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border-2 border-primary/30 bg-card p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">T</div>
          <h3 className="text-base font-semibold">Test Users</h3>
        </div>
        <button onClick={() => setMinimized(true)} className="text-muted-foreground hover:text-foreground text-sm px-2 py-1 rounded hover:bg-muted">
          Minimize
        </button>
      </div>
      <div className="space-y-4">
        {TEST_USERS.map((user) => (
          <div key={user.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user.role}</p>
            </div>
            <button
              onClick={() => {
                const emailInput = document.querySelector<HTMLInputElement>('[name="email"]');
                const passInput = document.querySelector<HTMLInputElement>('[name="password"]');
                if (emailInput) emailInput.value = user.email;
                if (passInput) passInput.value = user.password;
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-md border border-primary/30 hover:bg-primary/5 transition-colors"
            >
              Fill
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Password for all: <span className="font-mono font-medium text-foreground">password123</span>
        </p>
      </div>
    </div>
  );
}

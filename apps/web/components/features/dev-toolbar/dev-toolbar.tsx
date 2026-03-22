"use client";

import { useState } from "react";

const TEST_USERS = [
  { email: "alice@test.com", password: "password123", role: "Owner of Acme Corp & Startup Labs" },
  { email: "bob@test.com", password: "password123", role: "Admin of Acme Corp, Member of Startup Labs" },
  { email: "carol@test.com", password: "password123", role: "Member of Acme Corp" },
  { email: "dave@test.com", password: "password123", role: "Pending invite to Acme Corp" },
];

export function DevToolbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-80 rounded-xl border border-border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Test Users</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
              Hide
            </button>
          </div>
          <div className="space-y-3">
            {TEST_USERS.map((user) => (
              <div key={user.email} className="text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const emailInput = document.querySelector<HTMLInputElement>('[name="email"]');
                      const passInput = document.querySelector<HTMLInputElement>('[name="password"]');
                      if (emailInput) emailInput.value = user.email;
                      if (passInput) passInput.value = user.password;
                    }}
                    className="font-mono text-primary hover:underline"
                  >
                    {user.email}
                  </button>
                </div>
                <p className="text-muted-foreground mt-0.5">{user.role}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-2">
            Password: <span className="font-mono">password123</span>
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center text-sm font-bold"
      >
        ?
      </button>
    </div>
  );
}

import type { ReactNode } from "react";
import { DevToolbar } from "@/components/features/dev-toolbar/dev-toolbar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md">{children}</div>
      <DevToolbar />
    </div>
  );
}

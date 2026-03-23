"use client";

import { useActivityFeed, type ActivityEvent } from "@/hooks/use-activity-feed";

const dotColors: Record<string, string> = {
  "run.started": "bg-blue-500",
  "run.completed": "bg-emerald-500",
  "run.failed": "bg-red-500",
  "session.started": "bg-purple-500",
  "session.completed": "bg-purple-500",
  "session.failed": "bg-purple-500",
};

function eventLabel(type: string): string {
  switch (type) {
    case "run.started":
      return "Run started";
    case "run.completed":
      return "Run completed";
    case "run.failed":
      return "Run failed";
    case "session.started":
      return "Session started";
    case "session.completed":
      return "Session completed";
    case "session.failed":
      return "Session failed";
    default:
      return type;
  }
}

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function EventRow({ event }: { event: ActivityEvent }) {
  const dot = dotColors[event.type] ?? "bg-gray-400";
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-medium">{event.agentId.slice(0, 8)}</span>
          <span className="text-muted-foreground"> {eventLabel(event.type)}</span>
        </p>
        {event.detail && (
          <p className="text-xs text-muted-foreground truncate">{event.detail}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">
        {relativeTime(event.timestamp)}
      </span>
    </div>
  );
}

export function ActivityFeed({ orgId }: { orgId: string }) {
  const { events, isConnected } = useActivityFeed(orgId);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Activity Feed</h3>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live
          </span>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-border">
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No activity yet. Events will appear here in real-time.
          </p>
        ) : (
          events.map((event, i) => <EventRow key={`${event.timestamp}-${i}`} event={event} />)
        )}
      </div>
    </div>
  );
}

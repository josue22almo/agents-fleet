"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const MAX_EVENTS = 50;

export interface ActivityEvent {
  agentId: string;
  type: string;
  detail?: string;
  timestamp: string;
}

export function useActivityFeed(organizationId: string) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addEvent = useCallback((event: ActivityEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useEffect(() => {
    if (!organizationId) return;

    const url = `${API_URL}/dashboard/events?organizationId=${organizationId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ActivityEvent;
        addEvent(data);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [organizationId, addEvent]);

  return { events, isConnected };
}

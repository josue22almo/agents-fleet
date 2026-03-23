import { Controller, Query, Sse } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Observable, fromEvent, map } from "rxjs";

interface ActivityEvent {
  agentId: string;
  type: string;
  detail?: string;
  timestamp: string;
}

@Controller("dashboard")
export class EventsController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Sse("events")
  handleEvents(
    @Query("organizationId") _orgId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const handler = (event: ActivityEvent) => {
        subscriber.next({
          data: JSON.stringify(event),
        } as MessageEvent);
      };

      this.eventEmitter.on("activity.run", handler);
      this.eventEmitter.on("activity.session", handler);

      return () => {
        this.eventEmitter.off("activity.run", handler);
        this.eventEmitter.off("activity.session", handler);
      };
    });
  }
}

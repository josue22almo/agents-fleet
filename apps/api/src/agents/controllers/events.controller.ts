import { Controller, Inject, Query, Sse, UseGuards } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

interface ActivityEvent {
  agentId: string;
  type: string;
  detail?: string;
  timestamp: string;
}

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(@Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2) {}

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

      this.eventEmitter.on("activity", handler);

      return () => {
        this.eventEmitter.off("activity", handler);
      };
    });
  }
}

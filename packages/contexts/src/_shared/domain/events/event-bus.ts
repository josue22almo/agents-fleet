import type { DomainEvent } from "./domain-event.js";
import type { EventHandler } from "./event-handler.js";

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  register(handler: EventHandler<DomainEvent>): void;
}

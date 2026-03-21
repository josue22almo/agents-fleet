import type { DomainEvent } from "./domain-event";
import type { EventHandler } from "./event-handler";

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  register(handler: EventHandler<DomainEvent>): void;
}

import type { DomainEvent } from "../domain/events/domain-event";
import type { EventBus } from "../domain/events/event-bus";
import type { EventHandler } from "../domain/events/event-handler";

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler<DomainEvent>[]> = new Map();

  register(handler: EventHandler<DomainEvent>): void {
    const existing = this.handlers.get(handler.eventName) ?? [];
    existing.push(handler);
    this.handlers.set(handler.eventName, existing);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.eventName) ?? [];
      await Promise.all(handlers.map((h) => h.handle(event)));
    }
  }
}

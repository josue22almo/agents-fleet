import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import type { EventBus, DomainEvent, EventHandler } from "@repo/contexts/_shared";

@Injectable()
export class NestJsEventBusAdapter implements EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.emitter.emitAsync(event.eventName, event);
    }
  }

  register(handler: EventHandler<DomainEvent>): void {
    this.emitter.on(handler.eventName, (event: DomainEvent) => handler.handle(event));
  }
}

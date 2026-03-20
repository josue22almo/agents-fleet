import { randomUUID } from "node:crypto";

export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;

  constructor(
    readonly eventName: string,
    readonly aggregateId: string,
    params?: { eventId?: string; occurredOn?: Date },
  ) {
    this.eventId = params?.eventId ?? randomUUID();
    this.occurredOn = params?.occurredOn ?? new Date();
  }
}

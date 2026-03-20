export abstract class DomainEvent {
  readonly occurredOn: Date;

  constructor(readonly eventName: string) {
    this.occurredOn = new Date();
  }
}

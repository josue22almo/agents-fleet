import { describe, it, expect, vi } from "vitest";
import { DomainEvent } from "../domain/events/domain-event";
import { EventHandler } from "../domain/events/event-handler";
import { InMemoryEventBus } from "./in-memory-event-bus";

class UserCreated extends DomainEvent {
  constructor(readonly userId: string) {
    super("UserCreated", userId);
  }
}

class OrderPlaced extends DomainEvent {
  constructor(readonly orderId: string) {
    super("OrderPlaced", orderId);
  }
}

class OnUserCreatedEventHandler extends EventHandler<UserCreated> {
  readonly eventName = "UserCreated";
  handle = vi.fn(async (_event: UserCreated) => {});
}

class OnOrderPlacedEventHandler extends EventHandler<OrderPlaced> {
  readonly eventName = "OrderPlaced";
  handle = vi.fn(async (_event: OrderPlaced) => {});
}

describe("InMemoryEventBus", () => {
  it("dispatches events to registered handlers", async () => {
    const bus = new InMemoryEventBus();
    const handler = new OnUserCreatedEventHandler();
    bus.register(handler);

    const event = new UserCreated("user-1");
    await bus.publish([event]);

    expect(handler.handle).toHaveBeenCalledWith(event);
    expect(handler.handle).toHaveBeenCalledTimes(1);
  });

  it("dispatches to multiple handlers for the same event", async () => {
    const bus = new InMemoryEventBus();
    const handler1 = new OnUserCreatedEventHandler();
    const handler2 = new OnUserCreatedEventHandler();
    bus.register(handler1);
    bus.register(handler2);

    const event = new UserCreated("user-1");
    await bus.publish([event]);

    expect(handler1.handle).toHaveBeenCalledTimes(1);
    expect(handler2.handle).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch to handlers for different events", async () => {
    const bus = new InMemoryEventBus();
    const userHandler = new OnUserCreatedEventHandler();
    const orderHandler = new OnOrderPlacedEventHandler();
    bus.register(userHandler);
    bus.register(orderHandler);

    await bus.publish([new UserCreated("user-1")]);

    expect(userHandler.handle).toHaveBeenCalledTimes(1);
    expect(orderHandler.handle).not.toHaveBeenCalled();
  });

  it("publishes multiple events in order", async () => {
    const bus = new InMemoryEventBus();
    const userHandler = new OnUserCreatedEventHandler();
    const orderHandler = new OnOrderPlacedEventHandler();
    bus.register(userHandler);
    bus.register(orderHandler);

    await bus.publish([new UserCreated("user-1"), new OrderPlaced("order-1")]);

    expect(userHandler.handle).toHaveBeenCalledTimes(1);
    expect(orderHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no handlers are registered", async () => {
    const bus = new InMemoryEventBus();
    await expect(bus.publish([new UserCreated("user-1")])).resolves.toBeUndefined();
  });
});

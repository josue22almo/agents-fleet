import { describe, it, expect } from "vitest";
import { DomainEvent } from "./domain-event";

class TestEvent extends DomainEvent {
  constructor(aggregateId: string, readonly payload: string) {
    super("TestEvent", aggregateId);
  }
}

describe("DomainEvent", () => {
  it("generates a unique eventId", () => {
    const event = new TestEvent("agg-1", "data");
    expect(event.eventId).toBeDefined();
    expect(event.eventId.length).toBeGreaterThan(0);
  });

  it("sets occurredOn to current date", () => {
    const before = new Date();
    const event = new TestEvent("agg-1", "data");
    const after = new Date();

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("stores eventName and aggregateId", () => {
    const event = new TestEvent("agg-1", "data");
    expect(event.eventName).toBe("TestEvent");
    expect(event.aggregateId).toBe("agg-1");
  });

  it("allows overriding eventId and occurredOn", () => {
    const date = new Date("2025-01-01");
    const event = new (class extends DomainEvent {
      constructor() {
        super("Custom", "agg-2", { eventId: "custom-id", occurredOn: date });
      }
    })();

    expect(event.eventId).toBe("custom-id");
    expect(event.occurredOn).toBe(date);
  });

  it("generates different eventIds for different instances", () => {
    const event1 = new TestEvent("agg-1", "data");
    const event2 = new TestEvent("agg-1", "data");
    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

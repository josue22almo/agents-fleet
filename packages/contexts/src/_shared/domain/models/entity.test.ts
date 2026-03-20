import { describe, it, expect } from "vitest";
import { Entity } from "./entity.js";

class TestEntity extends Entity {
  constructor(id: string, readonly name: string) {
    super(id);
  }
}

describe("Entity", () => {
  it("stores the id", () => {
    const entity = new TestEntity("1", "test");
    expect(entity.id).toBe("1");
  });

  it("equals another entity with the same id", () => {
    const a = new TestEntity("1", "name-a");
    const b = new TestEntity("1", "name-b");
    expect(a.equals(b)).toBe(true);
  });

  it("does not equal an entity with a different id", () => {
    const a = new TestEntity("1", "test");
    const b = new TestEntity("2", "test");
    expect(a.equals(b)).toBe(false);
  });
});

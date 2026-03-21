import { describe, it, expect } from "vitest";
import { ValueObject } from "./value-object";

class Email extends ValueObject<string> {
  protected validate(value: string): void {
    if (!value.includes("@")) {
      throw new Error("Invalid email");
    }
  }
}

describe("ValueObject", () => {
  it("stores the value", () => {
    const email = new Email("test@example.com");
    expect(email.value).toBe("test@example.com");
  });

  it("validates on construction", () => {
    expect(() => new Email("invalid")).toThrow("Invalid email");
  });

  it("equals another value object with the same value", () => {
    const a = new Email("test@example.com");
    const b = new Email("test@example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("does not equal a value object with a different value", () => {
    const a = new Email("a@example.com");
    const b = new Email("b@example.com");
    expect(a.equals(b)).toBe(false);
  });
});

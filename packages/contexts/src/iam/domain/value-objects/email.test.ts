import { describe, it, expect } from "vitest";
import { Email } from "./email.js";

describe("Email", () => {
  it("creates a valid email", () => {
    const email = new Email("test@example.com");
    expect(email.value).toBe("test@example.com");
  });

  it("rejects an email without @", () => {
    expect(() => new Email("invalid")).toThrow("Invalid email");
  });

  it("rejects an empty string", () => {
    expect(() => new Email("")).toThrow("Invalid email");
  });

  it("rejects an email without domain", () => {
    expect(() => new Email("user@")).toThrow("Invalid email");
  });

  it("compares two equal emails", () => {
    const a = new Email("test@example.com");
    const b = new Email("test@example.com");
    expect(a.equals(b)).toBe(true);
  });

  it("compares two different emails", () => {
    const a = new Email("a@example.com");
    const b = new Email("b@example.com");
    expect(a.equals(b)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { Mail } from "./mail.js";

describe("Mail", () => {
  it("creates a mail with all fields", () => {
    const mail = Mail.create({
      to: "user@example.com",
      subject: "Welcome",
      body: "<p>Hello!</p>",
    });
    const primitives = mail.toPrimitives();
    expect(primitives.to).toBe("user@example.com");
    expect(primitives.subject).toBe("Welcome");
    expect(primitives.body).toBe("<p>Hello!</p>");
  });

  it("rejects empty recipient", () => {
    expect(() => Mail.create({ to: "", subject: "Test", body: "Body" })).toThrow(
      "Mail recipient is required",
    );
  });

  it("rejects empty subject", () => {
    expect(() => Mail.create({ to: "a@b.com", subject: "", body: "Body" })).toThrow(
      "Mail subject is required",
    );
  });

  it("rejects empty body", () => {
    expect(() => Mail.create({ to: "a@b.com", subject: "Test", body: "" })).toThrow(
      "Mail body is required",
    );
  });
});

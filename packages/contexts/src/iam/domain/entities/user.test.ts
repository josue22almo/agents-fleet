import { describe, it, expect } from "vitest";
import { Email } from "../value-objects/email.js";
import { User } from "./user.js";

function createUser(overrides?: Partial<Parameters<typeof User.create>[0]>) {
  return User.create({
    id: "user-1",
    email: new Email("test@example.com"),
    fullName: "Test User",
    avatarUrl: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  });
}

describe("User", () => {
  it("creates a user and exposes primitives", () => {
    const user = createUser();
    const primitives = user.toPrimitives();
    expect(primitives.id).toBe("user-1");
    expect(primitives.email).toBe("test@example.com");
    expect(primitives.fullName).toBe("Test User");
    expect(primitives.avatarUrl).toBeNull();
  });

  it("checks email equality", () => {
    const user = createUser();
    expect(user.hasEmail(new Email("test@example.com"))).toBe(true);
    expect(user.hasEmail(new Email("other@example.com"))).toBe(false);
  });

  it("updates profile and reflects in primitives", () => {
    const user = createUser();
    user.updateProfile("New Name", "https://example.com/avatar.png");
    const primitives = user.toPrimitives();
    expect(primitives.fullName).toBe("New Name");
    expect(primitives.avatarUrl).toBe("https://example.com/avatar.png");
    expect(primitives.updatedAt.getTime()).toBeGreaterThan(
      new Date("2025-01-01").getTime(),
    );
  });

  it("allows null values in profile update", () => {
    const user = createUser({ fullName: "Original" });
    user.updateProfile(null, null);
    const primitives = user.toPrimitives();
    expect(primitives.fullName).toBeNull();
    expect(primitives.avatarUrl).toBeNull();
  });
});

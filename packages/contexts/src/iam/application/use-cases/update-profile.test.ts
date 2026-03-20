import { describe, it, expect } from "vitest";
import { User } from "../../domain/entities/user.js";
import { Email } from "../../domain/value-objects/email.js";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error.js";
import { createTestDeps } from "./_test-helpers.js";
import { UpdateProfile } from "./update-profile.js";

describe("UpdateProfile", () => {
  it("updates user profile", async () => {
    const deps = createTestDeps();
    const user = User.create({
      id: "user-1",
      email: new Email("test@example.com"),
      fullName: "Old Name",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await deps.userRepo.save(user);

    const updateProfile = new UpdateProfile(deps.userRepo);
    const updated = await updateProfile.execute({
      userId: "user-1",
      fullName: "New Name",
      avatarUrl: "https://example.com/avatar.png",
    });

    const primitives = updated.toPrimitives();
    expect(primitives.fullName).toBe("New Name");
    expect(primitives.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("throws when user not found", async () => {
    const deps = createTestDeps();
    const updateProfile = new UpdateProfile(deps.userRepo);

    await expect(
      updateProfile.execute({
        userId: "nonexistent",
        fullName: "Name",
        avatarUrl: null,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });
});

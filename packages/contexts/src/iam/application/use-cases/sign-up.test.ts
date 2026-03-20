import { describe, it, expect } from "vitest";
import { createTestDeps } from "./_test-helpers.js";
import { SignUp } from "./sign-up.js";

describe("SignUp", () => {
  it("creates a user and a personal organization", async () => {
    const deps = createTestDeps();
    const signUp = new SignUp(
      deps.authService,
      deps.userRepo,
      deps.orgRepo,
      deps.idGenerator,
      deps.eventBus,
    );

    const user = await signUp.execute({
      email: "josue@example.com",
      password: "password123",
      fullName: "Josue",
    });

    const userPrimitives = user.toPrimitives();
    expect(userPrimitives.email).toBe("josue@example.com");
    expect(userPrimitives.fullName).toBe("Josue");

    const orgs = await deps.orgRepo.findByUserId(user.id);
    expect(orgs).toHaveLength(1);
    expect(orgs[0]!.isPersonal).toBe(true);
  });

  it("uses email prefix for org name when fullName is null", async () => {
    const deps = createTestDeps();
    const signUp = new SignUp(
      deps.authService,
      deps.userRepo,
      deps.orgRepo,
      deps.idGenerator,
      deps.eventBus,
    );

    await signUp.execute({
      email: "test@example.com",
      password: "password123",
      fullName: null,
    });

    const orgs = await deps.orgRepo.findByUserId("id-1");
    expect(orgs).toHaveLength(1);
    const primitives = orgs[0]!.toPrimitives();
    expect(primitives.name).toContain("test");
  });
});

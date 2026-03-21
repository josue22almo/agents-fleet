import { describe, it, expect } from "vitest";
import { createTestDeps } from "./_test-helpers";
import { SignUp } from "./sign-up";
import { CreateProfileOnUserSignedUpEventHandler } from "../event-handlers/create-profile-on-user-signed-up.event-handler";
import { CreatePersonalOrgOnUserSignedUpEventHandler } from "../event-handlers/create-personal-org-on-user-signed-up.event-handler";

function setupSignUp(deps: ReturnType<typeof createTestDeps>) {
  deps.eventBus.register(new CreateProfileOnUserSignedUpEventHandler(deps.userRepo));
  deps.eventBus.register(new CreatePersonalOrgOnUserSignedUpEventHandler(deps.orgRepo, deps.idGenerator));

  return new SignUp(deps.authService, deps.eventBus);
}

describe("SignUp", () => {
  it("completes without error", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

    await expect(
      signUp.execute({
        email: "josue@example.com",
        password: "password123",
        fullName: "Josue",
      }),
    ).resolves.toBeUndefined();
  });

  it("creates a user profile via event handler", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

    await signUp.execute({
      email: "josue@example.com",
      password: "password123",
      fullName: "Josue",
    });

    const user = await deps.userRepo.findById("id-1");
    expect(user).not.toBeNull();
    const primitives = user!.toPrimitives();
    expect(primitives.email).toBe("josue@example.com");
    expect(primitives.fullName).toBe("Josue");
  });

  it("creates a personal organization via event handler", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

    await signUp.execute({
      email: "josue@example.com",
      password: "password123",
      fullName: "Josue",
    });

    const orgs = await deps.orgRepo.findByUserId("id-1");
    expect(orgs).toHaveLength(1);
    expect(orgs[0]!.isPersonal).toBe(true);
    const primitives = orgs[0]!.toPrimitives();
    expect(primitives.name).toContain("Josue");
  });

  it("uses email prefix for org name when fullName is null", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

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

  it("creates org with owner membership", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

    await signUp.execute({
      email: "josue@example.com",
      password: "password123",
      fullName: "Josue",
    });

    const orgs = await deps.orgRepo.findByUserId("id-1");
    const org = orgs[0]!;
    expect(org.canCurrentUserManage).toBe(true);
  });

  it("publishes UserSignedUp event", async () => {
    const deps = createTestDeps();
    const signUp = setupSignUp(deps);

    await signUp.execute({
      email: "josue@example.com",
      password: "password123",
      fullName: "Josue",
    });

    expect(deps.eventBus.publishedEvents).toHaveLength(1);
    expect(deps.eventBus.publishedEvents[0]!.eventName).toBe("iam.user.signed_up");
  });
});

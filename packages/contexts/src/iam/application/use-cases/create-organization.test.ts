import { describe, it, expect } from "vitest";
import { SlugAlreadyTakenError } from "../../domain/errors/slug-already-taken.error";
import { createTestDeps } from "./_test-helpers";
import { CreateOrganization } from "./create-organization";

describe("CreateOrganization", () => {
  it("creates a team organization with the creator as owner", async () => {
    const deps = createTestDeps();
    const createOrg = new CreateOrganization(deps.orgRepo, deps.idGenerator, deps.eventBus);

    const org = await createOrg.execute({
      name: "Acme Inc",
      slug: "acme",
      createdBy: "user-1",
    });

    expect(org.isTeam).toBe(true);
    expect(org.isMemberOwner("user-1")).toBe(true);
    expect(org.toPrimitives().name).toBe("Acme Inc");
    expect(org.toPrimitives().slug).toBe("acme");
  });

  it("throws when slug is already taken", async () => {
    const deps = createTestDeps();
    const createOrg = new CreateOrganization(deps.orgRepo, deps.idGenerator, deps.eventBus);

    await createOrg.execute({ name: "First", slug: "acme", createdBy: "user-1" });

    await expect(
      createOrg.execute({ name: "Second", slug: "acme", createdBy: "user-2" }),
    ).rejects.toThrow(SlugAlreadyTakenError);
  });
});

import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization.js";
import { OrganizationMember } from "../../domain/entities/organization-member.js";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error.js";
import { SlugAlreadyTakenError } from "../../domain/errors/slug-already-taken.error.js";
import { InsufficientPermissionsError } from "../../domain/errors/insufficient-permissions.error.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import { Slug } from "../../domain/value-objects/slug.js";
import { createTestDeps } from "./_test-helpers.js";
import { UpdateOrganization } from "./update-organization.js";

function seedOrg(deps: ReturnType<typeof createTestDeps>) {
  const org = Organization.create({
    id: "org-1",
    name: "Old Name",
    slug: new Slug("old-slug"),
    type: OrgType.TEAM,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      OrganizationMember.create({
        id: "m-1",
        organizationId: "org-1",
        userId: "user-1",
        role: MemberRole.OWNER,
        createdAt: new Date(),
      }),
    ],
  });
  return deps.orgRepo.save(org);
}

describe("UpdateOrganization", () => {
  it("updates name and slug", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);
    const useCase = new UpdateOrganization(deps.orgRepo);

    const updated = await useCase.execute({
      organizationId: "org-1",
      name: "New Name",
      slug: "new-slug",
      updatedBy: "user-1",
    });

    expect(updated.toPrimitives().name).toBe("New Name");
    expect(updated.toPrimitives().slug).toBe("new-slug");
  });

  it("throws when org not found", async () => {
    const deps = createTestDeps();
    const useCase = new UpdateOrganization(deps.orgRepo);

    await expect(
      useCase.execute({
        organizationId: "nonexistent",
        name: "Name",
        slug: "slug",
        updatedBy: "user-1",
      }),
    ).rejects.toThrow(OrganizationNotFoundError);
  });

  it("throws when new slug is taken by another org", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);

    const otherOrg = Organization.create({
      id: "org-2",
      name: "Other",
      slug: new Slug("taken-slug"),
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await deps.orgRepo.save(otherOrg);

    const useCase = new UpdateOrganization(deps.orgRepo);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        name: "New",
        slug: "taken-slug",
        updatedBy: "user-1",
      }),
    ).rejects.toThrow(SlugAlreadyTakenError);
  });

  it("rejects non-admin update", async () => {
    const deps = createTestDeps();
    const org = Organization.create({
      id: "org-1",
      name: "Org",
      slug: new Slug("org"),
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [
        OrganizationMember.create({
          id: "m-1",
          organizationId: "org-1",
          userId: "user-1",
          role: MemberRole.MEMBER,
          createdAt: new Date(),
        }),
      ],
    });
    await deps.orgRepo.save(org);

    const useCase = new UpdateOrganization(deps.orgRepo);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        name: "New",
        slug: "new",
        updatedBy: "user-1",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });
});

import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization.js";
import { OrganizationMember } from "../../domain/entities/organization-member.js";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error.js";
import { InsufficientPermissionsError } from "../../domain/errors/insufficient-permissions.error.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import { Slug } from "../../domain/value-objects/slug.js";
import { createTestDeps } from "./_test-helpers.js";
import { DeleteOrganization } from "./delete-organization.js";

describe("DeleteOrganization", () => {
  it("allows owner to delete", async () => {
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
          role: MemberRole.OWNER,
          createdAt: new Date(),
        }),
      ],
    });
    await deps.orgRepo.save(org);

    const useCase = new DeleteOrganization(deps.orgRepo);
    await useCase.execute({ organizationId: "org-1", deletedBy: "user-1" });

    expect(await deps.orgRepo.findById("org-1")).toBeNull();
  });

  it("rejects non-owner deletion", async () => {
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
          role: MemberRole.ADMIN,
          createdAt: new Date(),
        }),
      ],
    });
    await deps.orgRepo.save(org);

    const useCase = new DeleteOrganization(deps.orgRepo);
    await expect(
      useCase.execute({ organizationId: "org-1", deletedBy: "user-1" }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });

  it("throws when org not found", async () => {
    const deps = createTestDeps();
    const useCase = new DeleteOrganization(deps.orgRepo);
    await expect(
      useCase.execute({ organizationId: "nonexistent", deletedBy: "user-1" }),
    ).rejects.toThrow(OrganizationNotFoundError);
  });
});

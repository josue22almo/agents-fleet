import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization";
import { OrganizationMember } from "../../domain/entities/organization-member";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import { createTestDeps } from "./_test-helpers";
import { DeleteOrganization } from "./delete-organization";

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

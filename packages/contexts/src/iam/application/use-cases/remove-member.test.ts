import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization";
import { OrganizationMember } from "../../domain/entities/organization-member";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import { createTestDeps } from "./_test-helpers";
import { RemoveMember } from "./remove-member";

async function seedOrg(deps: ReturnType<typeof createTestDeps>) {
  const org = Organization.create({
    id: "org-1",
    name: "Acme",
    slug: new Slug("acme"),
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
      OrganizationMember.create({
        id: "m-2",
        organizationId: "org-1",
        userId: "user-2",
        role: MemberRole.MEMBER,
        createdAt: new Date(),
      }),
    ],
  });
  await deps.orgRepo.save(org);
}

describe("RemoveMember", () => {
  it("allows owner to remove a member", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);

    const useCase = new RemoveMember(deps.orgRepo);
    await useCase.execute({
      organizationId: "org-1",
      targetUserId: "user-2",
      removedBy: "user-1",
    });

    const org = (await deps.orgRepo.findById("org-1"))!;
    expect(org.hasMember("user-2")).toBe(false);
  });

  it("rejects non-owner removal", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);

    const useCase = new RemoveMember(deps.orgRepo);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        targetUserId: "user-1",
        removedBy: "user-2",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });
});

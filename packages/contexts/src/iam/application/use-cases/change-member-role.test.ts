import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization";
import { OrganizationMember } from "../../domain/entities/organization-member";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import { createTestDeps } from "./_test-helpers";
import { ChangeMemberRole } from "./change-member-role";

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

describe("ChangeMemberRole", () => {
  it("changes a member role", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);

    const useCase = new ChangeMemberRole(deps.orgRepo);
    await useCase.execute({
      organizationId: "org-1",
      targetUserId: "user-2",
      newRole: MemberRole.ADMIN,
      changedBy: "user-1",
    });

    const org = (await deps.orgRepo.findById("org-1"))!;
    expect(org.isMemberAdmin("user-2")).toBe(true);
  });

  it("rejects non-admin changing role", async () => {
    const deps = createTestDeps();
    await seedOrg(deps);

    const useCase = new ChangeMemberRole(deps.orgRepo);
    await expect(
      useCase.execute({
        organizationId: "org-1",
        targetUserId: "user-1",
        newRole: MemberRole.ADMIN,
        changedBy: "user-2",
      }),
    ).rejects.toThrow(InsufficientPermissionsError);
  });
});

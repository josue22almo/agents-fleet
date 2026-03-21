import { describe, it, expect } from "vitest";
import { Organization } from "../../domain/entities/organization";
import { OrganizationMember } from "../../domain/entities/organization-member";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/value-objects/email";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { createTestDeps } from "./_test-helpers";
import { ListMembers } from "./list-members";

async function seedOrgWithMembers(deps: ReturnType<typeof createTestDeps>) {
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

  for (const [id, email, name] of [
    ["user-1", "owner@example.com", "Owner"],
    ["user-2", "member@example.com", "Member"],
  ] as const) {
    await deps.userRepo.save(
      User.create({
        id,
        email: new Email(email),
        fullName: name,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }
}

describe("ListMembers", () => {
  it("returns all members with their details", async () => {
    const deps = createTestDeps();
    await seedOrgWithMembers(deps);

    const useCase = new ListMembers(deps.orgRepo, deps.userRepo);
    const members = await useCase.execute("org-1", "user-1");

    expect(members).toHaveLength(2);
    const ownerPrimitives = members.find((m) => m.isOwner)!.toPrimitives();
    expect(ownerPrimitives.fullName).toBe("Owner");
    expect(ownerPrimitives.email).toBe("owner@example.com");
  });

  it("throws when non-member requests", async () => {
    const deps = createTestDeps();
    await seedOrgWithMembers(deps);

    const useCase = new ListMembers(deps.orgRepo, deps.userRepo);
    await expect(
      useCase.execute("org-1", "user-999"),
    ).rejects.toThrow(OrganizationNotFoundError);
  });
});

import { describe, it, expect } from "vitest";
import { Invitation } from "../../domain/entities/invitation.js";
import { Organization } from "../../domain/entities/organization.js";
import { OrganizationMember } from "../../domain/entities/organization-member.js";
import { Email } from "../../domain/value-objects/email.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import { Slug } from "../../domain/value-objects/slug.js";
import { InvalidTokenError } from "../../domain/errors/invalid-token.error.js";
import { createTestDeps } from "./_test-helpers.js";
import { AcceptInvitation } from "./accept-invitation.js";

async function seedInvitation(deps: ReturnType<typeof createTestDeps>) {
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
    ],
  });
  await deps.orgRepo.save(org);

  const invitation = Invitation.create({
    id: "inv-1",
    organizationId: "org-1",
    email: new Email("invited@example.com"),
    role: MemberRole.MEMBER,
    token: "invite-token",
    invitedBy: "user-1",
  });
  await deps.invitationRepo.save(invitation);
}

describe("AcceptInvitation", () => {
  it("accepts invitation and adds member to org", async () => {
    const deps = createTestDeps();
    await seedInvitation(deps);

    const useCase = new AcceptInvitation(
      deps.invitationRepo,
      deps.orgRepo,
      deps.idGenerator,
      deps.eventBus,
    );

    await useCase.execute({ token: "invite-token", userId: "user-2" });

    const org = (await deps.orgRepo.findById("org-1"))!;
    expect(org.hasMember("user-2")).toBe(true);

    const invitation = (await deps.invitationRepo.findByToken("invite-token"))!;
    expect(invitation.isAccepted).toBe(true);
  });

  it("throws on invalid token", async () => {
    const deps = createTestDeps();
    const useCase = new AcceptInvitation(
      deps.invitationRepo,
      deps.orgRepo,
      deps.idGenerator,
      deps.eventBus,
    );

    await expect(
      useCase.execute({ token: "bad-token", userId: "user-2" }),
    ).rejects.toThrow(InvalidTokenError);
  });
});

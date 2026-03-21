import { describe, it, expect, vi } from "vitest";
import { Organization } from "../../domain/entities/organization";
import { OrganizationMember } from "../../domain/entities/organization-member";
import { User } from "../../domain/entities/user";
import { Email } from "../../domain/value-objects/email";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import { AlreadyMemberError } from "../../domain/errors/already-member.error";
import { createTestDeps } from "./_test-helpers";
import { InviteMember } from "./invite-member";

async function seedOrgAndUser(deps: ReturnType<typeof createTestDeps>) {
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

  const user = User.create({
    id: "user-1",
    email: new Email("owner@example.com"),
    fullName: "Owner",
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await deps.userRepo.save(user);
}

describe("InviteMember", () => {
  it("creates an invitation and sends email", async () => {
    const deps = createTestDeps();
    await seedOrgAndUser(deps);
    const sendSpy = vi.spyOn(deps.emailService, "send");

    const useCase = new InviteMember(
      deps.orgRepo,
      deps.invitationRepo,
      deps.userRepo,
      deps.emailService,
      deps.idGenerator,
      deps.tokenGenerator,
      deps.eventBus,
    );

    const invitation = await useCase.execute({
      organizationId: "org-1",
      email: "invited@example.com",
      role: MemberRole.MEMBER,
      invitedBy: "user-1",
    });

    expect(invitation.isPending).toBe(true);
    expect(sendSpy).toHaveBeenCalledOnce();
  });

  it("throws when inviting an existing member", async () => {
    const deps = createTestDeps();
    await seedOrgAndUser(deps);

    const existingUser = User.create({
      id: "user-2",
      email: new Email("existing@example.com"),
      fullName: "Existing",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await deps.userRepo.save(existingUser);

    const org = (await deps.orgRepo.findById("org-1"))!;
    org.addMember("m-2", "user-2", MemberRole.MEMBER);
    await deps.orgRepo.save(org);

    const useCase = new InviteMember(
      deps.orgRepo,
      deps.invitationRepo,
      deps.userRepo,
      deps.emailService,
      deps.idGenerator,
      deps.tokenGenerator,
      deps.eventBus,
    );

    await expect(
      useCase.execute({
        organizationId: "org-1",
        email: "existing@example.com",
        role: MemberRole.MEMBER,
        invitedBy: "user-1",
      }),
    ).rejects.toThrow(AlreadyMemberError);
  });
});

import { describe, it, expect } from "vitest";
import { Invitation } from "../../domain/entities/invitation.js";
import { Email } from "../../domain/value-objects/email.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { InvalidTokenError } from "../../domain/errors/invalid-token.error.js";
import { createTestDeps } from "./_test-helpers.js";
import { DeclineInvitation } from "./decline-invitation.js";

describe("DeclineInvitation", () => {
  it("declines a pending invitation", async () => {
    const deps = createTestDeps();
    const invitation = Invitation.create({
      id: "inv-1",
      organizationId: "org-1",
      email: new Email("test@example.com"),
      role: MemberRole.MEMBER,
      token: "decline-token",
      invitedBy: "user-1",
    });
    await deps.invitationRepo.save(invitation);

    const useCase = new DeclineInvitation(deps.invitationRepo);
    await useCase.execute("decline-token");

    const updated = (await deps.invitationRepo.findByToken("decline-token"))!;
    expect(updated.isDeclined).toBe(true);
  });

  it("throws on invalid token", async () => {
    const deps = createTestDeps();
    const useCase = new DeclineInvitation(deps.invitationRepo);
    await expect(useCase.execute("bad-token")).rejects.toThrow(InvalidTokenError);
  });
});

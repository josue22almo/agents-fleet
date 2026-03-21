import { describe, it, expect, vi, afterEach } from "vitest";
import { InvitationExpiredError } from "../errors/invitation-expired.error";
import { Email } from "../value-objects/email";
import { MemberRole } from "../value-objects/member-role";
import { Invitation, InvitationStatus } from "./invitation";

function createInvitation() {
  return Invitation.create({
    id: "inv-1",
    organizationId: "org-1",
    email: new Email("invited@example.com"),
    role: MemberRole.MEMBER,
    token: "abc-123",
    invitedBy: "user-1",
  });
}

describe("Invitation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a pending invitation", () => {
    const invitation = createInvitation();
    expect(invitation.isPending).toBe(true);
    expect(invitation.isAccepted).toBe(false);
    expect(invitation.isDeclined).toBe(false);
    expect(invitation.hasToken("abc-123")).toBe(true);
  });

  it("checks email and org membership", () => {
    const invitation = createInvitation();
    expect(invitation.isForEmail(new Email("invited@example.com"))).toBe(true);
    expect(invitation.isForEmail(new Email("other@example.com"))).toBe(false);
    expect(invitation.belongsToOrganization("org-1")).toBe(true);
    expect(invitation.belongsToOrganization("org-999")).toBe(false);
  });

  it("sets expiration to 7 days from now", () => {
    const before = new Date();
    const invitation = createInvitation();
    const primitives = invitation.toPrimitives();
    const expectedExpiry = new Date(before);
    expectedExpiry.setDate(expectedExpiry.getDate() + 7);

    expect(primitives.expiresAt.getTime()).toBeGreaterThanOrEqual(
      expectedExpiry.getTime() - 1000,
    );
    expect(primitives.expiresAt.getTime()).toBeLessThanOrEqual(
      expectedExpiry.getTime() + 1000,
    );
  });

  it("accepts a pending invitation", () => {
    const invitation = createInvitation();
    invitation.accept();
    expect(invitation.isAccepted).toBe(true);
    expect(invitation.isPending).toBe(false);
  });

  it("declines a pending invitation", () => {
    const invitation = createInvitation();
    invitation.decline();
    expect(invitation.isDeclined).toBe(true);
    expect(invitation.isPending).toBe(false);
  });

  it("cannot accept an already accepted invitation", () => {
    const invitation = createInvitation();
    invitation.accept();
    expect(() => invitation.accept()).toThrow("already been accepted");
  });

  it("cannot decline an already declined invitation", () => {
    const invitation = createInvitation();
    invitation.decline();
    expect(() => invitation.decline()).toThrow("already been declined");
  });

  it("cannot accept an expired invitation", () => {
    vi.useFakeTimers();
    const invitation = createInvitation();
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
    expect(invitation.isExpired).toBe(true);
    expect(() => invitation.accept()).toThrow(InvitationExpiredError);
  });

  it("cannot decline an expired invitation", () => {
    vi.useFakeTimers();
    const invitation = createInvitation();
    vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000);
    expect(() => invitation.decline()).toThrow(InvitationExpiredError);
  });

  it("reconstitutes from stored data", () => {
    const invitation = Invitation.reconstitute({
      id: "inv-1",
      organizationId: "org-1",
      email: new Email("test@example.com"),
      role: MemberRole.ADMIN,
      token: "token-123",
      invitedBy: "user-1",
      status: InvitationStatus.ACCEPTED,
      expiresAt: new Date("2025-12-31"),
      createdAt: new Date("2025-01-01"),
    });
    expect(invitation.isAccepted).toBe(true);
  });

  it("exposes primitives for persistence", () => {
    const invitation = createInvitation();
    const primitives = invitation.toPrimitives();
    expect(primitives.email).toBe("invited@example.com");
    expect(primitives.organizationId).toBe("org-1");
    expect(primitives.invitedBy).toBe("user-1");
    expect(primitives.status).toBe("pending");
  });
});

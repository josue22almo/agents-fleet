import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApi } from "../../test-api";

describe("InvitationsController (e2e)", () => {
  let api: TestApi;
  let ownerToken: string;
  let orgId: string;
  let invitationToken: string;

  beforeAll(async () => {
    api = await TestApi.create();
    ownerToken = await api.signupAndLogin("inv-owner@example.com", "password123", "Owner");

    const orgRes = await api.createOrganization(ownerToken, "Invite Org", "invite-org");
    orgId = orgRes.body.id;

    const invRes = await api.inviteMember(ownerToken, orgId, "invitee@example.com", "member");
    invitationToken = invRes.body.token;
  });

  afterAll(async () => {
    await api.close();
  });

  it("GET /invites/:token — returns invite info", async () => {
    const res = await api.getInviteDetails(invitationToken);
    expect(res.status).toBe(200);
    expect(res.body.token).toBe(invitationToken);
  });

  it("POST /invites/:token/accept — accepts invitation", async () => {
    const inviteeToken = await api.signupAndLogin("invitee@example.com", "password123");
    const res = await api.acceptInvitation(inviteeToken, invitationToken);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Invitation accepted");
  });

  it("POST /invites/:token/accept — rejects already accepted", async () => {
    const inviteeToken = await api.signupAndLogin("invitee2@example.com", "password123");
    const res = await api.acceptInvitation(inviteeToken, invitationToken);
    expect(res.status).toBe(409);
  });

  it("POST /invites/bad-token/accept — returns 401 for invalid token", async () => {
    const res = await api.acceptInvitation(ownerToken, "bad-token");
    expect(res.status).toBe(401);
  });

  it("POST /invites/:token/decline — requires auth", async () => {
    const res = await api.declineInvitation("", "some-token");
    expect(res.status).toBe(401);
  });
});

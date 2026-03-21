import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { TestIamModule } from "./test-iam.module";
import { CatchAllFilter } from "./common/filters/catch-all.filter";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

export class TestApi {
  private constructor(private readonly app: INestApplication) {}

  static async create(): Promise<TestApi> {
    const module = await Test.createTestingModule({
      imports: [TestIamModule],
    }).compile();

    const app = module.createNestApplication();
    app.useGlobalFilters(new CatchAllFilter(), new DomainErrorFilter(), new ZodErrorFilter());
    await app.init();
    return new TestApi(app);
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  // Auth
  signup(email: string, password: string, fullName?: string) {
    return request(this.app.getHttpServer())
      .post("/auth/signup")
      .send({ email, password, fullName: fullName ?? null });
  }

  login(email: string, password: string) {
    return request(this.app.getHttpServer())
      .post("/auth/login")
      .send({ email, password });
  }

  forgotPassword(email: string) {
    return request(this.app.getHttpServer())
      .post("/auth/forgot-password")
      .send({ email });
  }

  resetPassword(token: string, password: string) {
    return request(this.app.getHttpServer())
      .post("/auth/reset-password")
      .send({ token, password });
  }

  getProfile(accessToken: string) {
    return request(this.app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
  }

  updateProfile(accessToken: string, data: { fullName?: string | null; avatarUrl?: string | null }) {
    return request(this.app.getHttpServer())
      .patch("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(data);
  }

  // Organizations
  listOrganizations(accessToken: string) {
    return request(this.app.getHttpServer())
      .get("/organizations")
      .set("Authorization", `Bearer ${accessToken}`);
  }

  createOrganization(accessToken: string, name: string, slug: string) {
    return request(this.app.getHttpServer())
      .post("/organizations")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name, slug });
  }

  updateOrganization(accessToken: string, orgId: string, name: string, slug: string) {
    return request(this.app.getHttpServer())
      .patch(`/organizations/${orgId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name, slug });
  }

  deleteOrganization(accessToken: string, orgId: string) {
    return request(this.app.getHttpServer())
      .delete(`/organizations/${orgId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  // Members
  listMembers(accessToken: string, orgId: string) {
    return request(this.app.getHttpServer())
      .get(`/organizations/${orgId}/members`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  inviteMember(accessToken: string, orgId: string, email: string, role: string) {
    return request(this.app.getHttpServer())
      .post(`/organizations/${orgId}/members`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ email, role });
  }

  changeMemberRole(accessToken: string, orgId: string, memberId: string, role: string) {
    return request(this.app.getHttpServer())
      .patch(`/organizations/${orgId}/members/${memberId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ role });
  }

  removeMember(accessToken: string, orgId: string, memberId: string) {
    return request(this.app.getHttpServer())
      .delete(`/organizations/${orgId}/members/${memberId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  // Invitations
  getInviteDetails(token: string) {
    return request(this.app.getHttpServer())
      .get(`/invites/${token}`);
  }

  acceptInvitation(accessToken: string, token: string) {
    return request(this.app.getHttpServer())
      .post(`/invites/${token}/accept`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  declineInvitation(accessToken: string, token: string) {
    return request(this.app.getHttpServer())
      .post(`/invites/${token}/decline`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  // Helpers
  async signupAndLogin(email: string, password: string, fullName?: string): Promise<string> {
    await this.signup(email, password, fullName);
    const res = await this.login(email, password);
    return res.body.accessToken;
  }
}

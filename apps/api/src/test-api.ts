import { INestApplication } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { TestIamModule } from "./iam/test-iam.module";
import { TestAgentsModule } from "./agents/test-agents.module";
import { CatchAllFilter } from "./common/filters/catch-all.filter";
import { DomainErrorFilter } from "./common/filters/domain-error.filter";
import { ZodErrorFilter } from "./common/filters/zod-error.filter";

const silentLogger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  verbose: () => {},
};

export class TestApi {
  private constructor(private readonly app: INestApplication) {}

  static async create(): Promise<TestApi> {
    const module = await Test.createTestingModule({
      imports: [TestIamModule, TestAgentsModule],
      providers: [
        { provide: "APP_LOGGER", useValue: silentLogger },
        { provide: APP_FILTER, useClass: CatchAllFilter },
        { provide: APP_FILTER, useClass: DomainErrorFilter },
        { provide: APP_FILTER, useClass: ZodErrorFilter },
      ],
    }).compile();

    const app = module.createNestApplication({ logger: false });
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
    return request(this.app.getHttpServer()).post("/auth/login").send({ email, password });
  }

  forgotPassword(email: string) {
    return request(this.app.getHttpServer()).post("/auth/forgot-password").send({ email });
  }

  resetPassword(token: string, password: string) {
    return request(this.app.getHttpServer()).post("/auth/reset-password").send({ token, password });
  }

  getProfile(accessToken: string) {
    return request(this.app.getHttpServer()).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);
  }

  updateProfile(accessToken: string, data: { fullName?: string | null; avatarUrl?: string | null }) {
    return request(this.app.getHttpServer()).patch("/auth/me").set("Authorization", `Bearer ${accessToken}`).send(data);
  }

  // Organizations
  listOrganizations(accessToken: string) {
    return request(this.app.getHttpServer()).get("/organizations").set("Authorization", `Bearer ${accessToken}`);
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
    return request(this.app.getHttpServer()).get(`/invites/${token}`);
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

  // Agents
  listAgents(accessToken: string, organizationId: string) {
    return request(this.app.getHttpServer())
      .get(`/agents?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  createAgent(accessToken: string, data: { name: string; type: string; organizationId: string }) {
    return request(this.app.getHttpServer())
      .post("/agents")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(data);
  }

  getAgent(accessToken: string, agentId: string, organizationId: string) {
    return request(this.app.getHttpServer())
      .get(`/agents/${agentId}?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  updateAgent(accessToken: string, agentId: string, organizationId: string, data: { name: string }) {
    return request(this.app.getHttpServer())
      .patch(`/agents/${agentId}?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(data);
  }

  deleteAgent(accessToken: string, agentId: string, organizationId: string) {
    return request(this.app.getHttpServer())
      .delete(`/agents/${agentId}?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  regenerateAgentToken(accessToken: string, agentId: string, organizationId: string) {
    return request(this.app.getHttpServer())
      .post(`/agents/${agentId}/regenerate-token?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  // Ingest
  ingestEvent(connectionToken: string, data: { event: string; runId: string; data?: Record<string, unknown> }) {
    return request(this.app.getHttpServer())
      .post("/ingest")
      .set("Authorization", `Bearer ${connectionToken}`)
      .send(data);
  }

  // Runs
  listRuns(accessToken: string, agentId: string, page?: number) {
    const url = page ? `/agents/${agentId}/runs?page=${page}` : `/agents/${agentId}/runs`;
    return request(this.app.getHttpServer())
      .get(url)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  getAgentMetrics(accessToken: string, agentId: string) {
    return request(this.app.getHttpServer())
      .get(`/agents/${agentId}/metrics`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  getDashboardMetrics(accessToken: string, organizationId: string) {
    return request(this.app.getHttpServer())
      .get(`/dashboard/metrics?organizationId=${organizationId}`)
      .set("Authorization", `Bearer ${accessToken}`);
  }

  // Helpers
  async signupAndLogin(email: string, password: string, fullName?: string): Promise<string> {
    await this.signup(email, password, fullName);
    const res = await this.login(email, password);
    return res.body.accessToken;
  }

  getModuleRef() {
    return this.app;
  }
}

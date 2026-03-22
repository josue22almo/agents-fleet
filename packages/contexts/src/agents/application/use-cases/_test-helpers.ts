import { InMemoryEventBus } from "../../../_shared/application/in-memory-event-bus";
import { InMemoryAgentRepository } from "../../infrastructure/persistence/in-memory-agent-repository";
import { InMemoryOrganizationRepository } from "../../../iam/infrastructure/persistence/in-memory-organization-repository";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import { Organization } from "../../../iam/domain/entities/organization";
import { MemberRole } from "../../../iam/domain/value-objects/member-role";
import { OrgType } from "../../../iam/domain/value-objects/org-type";
import { Slug } from "../../../iam/domain/value-objects/slug";

export function createTestDeps() {
  let idCounter = 0;

  const agentRepo = new InMemoryAgentRepository();
  const orgRepo = new InMemoryOrganizationRepository();
  const eventBus = new InMemoryEventBus();

  const idGenerator: IdGenerator = {
    generate: () => `id-${++idCounter}`,
  };

  return {
    agentRepo,
    orgRepo,
    eventBus,
    idGenerator,
  };
}

export async function seedOrganization(
  orgRepo: InMemoryOrganizationRepository,
  params: {
    orgId: string;
    ownerId: string;
    ownerMemberId: string;
    additionalMembers?: Array<{
      memberId: string;
      userId: string;
      role: MemberRole;
    }>;
  },
): Promise<Organization> {
  const org = Organization.create({
    id: params.orgId,
    name: "Test Org",
    slug: new Slug("test-org"),
    type: OrgType.TEAM,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  org.addMember(params.ownerMemberId, params.ownerId, MemberRole.OWNER);
  if (params.additionalMembers) {
    for (const m of params.additionalMembers) {
      org.addMember(m.memberId, m.userId, m.role);
    }
  }
  await orgRepo.save(org);
  return org;
}

import type { Organization } from "../../domain/entities/organization.js";
import { OrganizationSummary } from "../../domain/read-models/organization-summary.js";
import type { Slug } from "../../domain/value-objects/slug.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";
import type { PrimitiveOf } from "../../../_shared/domain/models/primitives.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private orgs: Map<string, Organization> = new Map();

  async findById(id: string): Promise<Organization | null> {
    return this.orgs.get(id) ?? null;
  }

  async findBySlug(slug: Slug): Promise<Organization | null> {
    for (const org of this.orgs.values()) {
      const primitives = org.toPrimitives();
      if (primitives.slug === slug.value) return org;
    }
    return null;
  }

  async slugExists(slug: Slug): Promise<boolean> {
    return (await this.findBySlug(slug)) !== null;
  }

  async findByUserId(userId: string): Promise<OrganizationSummary[]> {
    const results: OrganizationSummary[] = [];
    for (const org of this.orgs.values()) {
      if (!org.hasMember(userId)) continue;
      const primitives = org.toPrimitives();
      const member = primitives.members.find((m) => m.userId === userId);
      if (!member) continue;
      results.push(
        OrganizationSummary.create({
          id: primitives.id,
          name: primitives.name,
          slug: primitives.slug,
          type: primitives.type as OrgType,
          memberCount: primitives.members.length,
          currentUserRole: member.role as MemberRole,
        }),
      );
    }
    return results;
  }

  async save(organization: Organization): Promise<void> {
    this.orgs.set(organization.id, organization);
  }

  async delete(id: string): Promise<void> {
    this.orgs.delete(id);
  }
}

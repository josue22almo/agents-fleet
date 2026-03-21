import type { Organization } from "../../domain/entities/organization";
import type { OrganizationSummary } from "../../domain/read-models/organization-summary";
import type { Slug } from "../../domain/value-objects/slug";

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: Slug): Promise<Organization | null>;
  slugExists(slug: Slug): Promise<boolean>;
  findByUserId(userId: string): Promise<OrganizationSummary[]>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}

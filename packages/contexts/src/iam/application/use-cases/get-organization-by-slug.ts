import { Organization } from "../../domain/entities/organization";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { Slug } from "../../domain/value-objects/slug";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

export class GetOrganizationBySlug {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(slug: string): Promise<Organization> {
    const org = await this.orgRepo.findBySlug(new Slug(slug));
    if (!org) {
      throw new OrganizationNotFoundError(slug);
    }
    return org;
  }
}

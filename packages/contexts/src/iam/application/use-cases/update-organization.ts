import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { SlugAlreadyTakenError } from "../../domain/errors/slug-already-taken.error";
import { Slug } from "../../domain/value-objects/slug";
import type { Organization } from "../../domain/entities/organization";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

interface UpdateOrganizationParams {
  organizationId: string;
  name: string;
  slug: string;
  updatedBy: string;
}

export class UpdateOrganization {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(params: UpdateOrganizationParams): Promise<Organization> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    const newSlug = new Slug(params.slug);
    const orgPrimitives = org.toPrimitives();

    if (orgPrimitives.slug !== params.slug && await this.orgRepo.slugExists(newSlug)) {
      throw new SlugAlreadyTakenError(params.slug);
    }

    org.updateDetails(params.name, newSlug, params.updatedBy);
    await this.orgRepo.save(org);

    return org;
  }
}

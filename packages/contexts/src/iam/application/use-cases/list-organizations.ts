import type { OrganizationSummary } from "../../domain/read-models/organization-summary.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";

export class ListOrganizations {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(userId: string): Promise<OrganizationSummary[]> {
    return this.orgRepo.findByUserId(userId);
  }
}

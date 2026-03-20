import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";

interface RemoveMemberParams {
  organizationId: string;
  targetUserId: string;
  removedBy: string;
}

export class RemoveMember {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(params: RemoveMemberParams): Promise<void> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    org.removeMember(params.targetUserId, params.removedBy);
    await this.orgRepo.save(org);
  }
}

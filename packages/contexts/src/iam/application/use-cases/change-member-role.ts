import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error.js";
import type { MemberRole } from "../../domain/value-objects/member-role.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";

interface ChangeMemberRoleParams {
  organizationId: string;
  targetUserId: string;
  newRole: MemberRole;
  changedBy: string;
}

export class ChangeMemberRole {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(params: ChangeMemberRoleParams): Promise<void> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    org.changeMemberRole(params.targetUserId, params.newRole, params.changedBy);
    await this.orgRepo.save(org);
  }
}

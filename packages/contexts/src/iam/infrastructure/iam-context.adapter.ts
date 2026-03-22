import type { IAMContextPort } from "../../_shared/domain/ports/iam-context-port";
import type { OrganizationRepository } from "../ports/repositories/organization-repository";

export class IAMContextAdapter implements IAMContextPort {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async canUserManageOrganization(userId: string, organizationId: string): Promise<boolean> {
    const org = await this.orgRepo.findById(organizationId);
    return org?.canMemberManage(userId) ?? false;
  }

  async isUserOwnerOfOrganization(userId: string, organizationId: string): Promise<boolean> {
    const org = await this.orgRepo.findById(organizationId);
    return org?.isMemberOwner(userId) ?? false;
  }
}

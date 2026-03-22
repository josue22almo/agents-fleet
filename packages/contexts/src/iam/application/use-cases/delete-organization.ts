import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

interface DeleteOrganizationParams {
  organizationId: string;
  deletedBy: string;
}

export class DeleteOrganization {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(params: DeleteOrganizationParams): Promise<void> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.isMemberOwner(params.deletedBy)) {
      throw new InsufficientPermissionsError("delete this organization");
    }

    await this.orgRepo.delete(params.organizationId);
  }
}

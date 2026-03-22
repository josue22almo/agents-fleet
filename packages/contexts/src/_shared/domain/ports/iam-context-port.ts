/**
 * Port for cross-context communication with the IAM context.
 * Allows other contexts to check user permissions without
 * importing IAM domain objects directly.
 */
export interface IAMContextPort {
  canUserManageOrganization(userId: string, organizationId: string): Promise<boolean>;
  isUserOwnerOfOrganization(userId: string, organizationId: string): Promise<boolean>;
}

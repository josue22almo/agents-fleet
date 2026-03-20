import { DomainEvent } from "../../../_shared/domain/events/domain-event.js";
import type { OrgType } from "../value-objects/org-type.js";

export class OrganizationCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = "iam.organization.created";

  constructor(
    readonly organizationId: string,
    readonly slug: string,
    readonly orgType: OrgType,
    readonly createdBy: string,
  ) {
    super(OrganizationCreatedEvent.EVENT_NAME, organizationId);
  }
}

import type { EventBus } from "../../../_shared/domain/events/event-bus.js";
import { Organization } from "../../domain/entities/organization.js";
import { OrganizationCreatedEvent } from "../../domain/events/organization-created.event.js";
import { SlugAlreadyTakenError } from "../../domain/errors/slug-already-taken.error.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import { Slug } from "../../domain/value-objects/slug.js";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";

interface CreateOrganizationParams {
  name: string;
  slug: string;
  createdBy: string;
}

export class CreateOrganization {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: CreateOrganizationParams): Promise<Organization> {
    const slug = new Slug(params.slug);

    if (await this.orgRepo.slugExists(slug)) {
      throw new SlugAlreadyTakenError(params.slug);
    }

    const org = Organization.create({
      id: this.idGenerator.generate(),
      name: params.name,
      slug,
      type: OrgType.TEAM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    org.addMember(this.idGenerator.generate(), params.createdBy, MemberRole.OWNER);
    await this.orgRepo.save(org);

    await this.eventBus.publish([
      new OrganizationCreatedEvent(org.id, params.slug, OrgType.TEAM, params.createdBy),
    ]);

    return org;
  }
}

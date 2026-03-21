import type { EventBus } from "../../../_shared/domain/events/event-bus";
import { Organization } from "../../domain/entities/organization";
import { OrganizationCreatedEvent } from "../../domain/events/organization-created.event";
import { SlugAlreadyTakenError } from "../../domain/errors/slug-already-taken.error";
import { MemberRole } from "../../domain/value-objects/member-role";
import { OrgType } from "../../domain/value-objects/org-type";
import { Slug } from "../../domain/value-objects/slug";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";

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

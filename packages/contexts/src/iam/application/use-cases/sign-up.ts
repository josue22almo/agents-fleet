import type { EventBus } from "../../../_shared/domain/events/event-bus.js";
import { Organization } from "../../domain/entities/organization.js";
import { User } from "../../domain/entities/user.js";
import { UserSignedUpEvent } from "../../domain/events/user-signed-up.event.js";
import { OrganizationCreatedEvent } from "../../domain/events/organization-created.event.js";
import { Email } from "../../domain/value-objects/email.js";
import { OrgType } from "../../domain/value-objects/org-type.js";
import type { AuthService } from "../../ports/services/auth-service.js";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";
import type { UserRepository } from "../../ports/repositories/user-repository.js";

interface SignUpParams {
  email: string;
  password: string;
  fullName: string | null;
}

export class SignUp {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepo: UserRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: SignUpParams): Promise<User> {
    const authUser = await this.authService.signUp(params.email, params.password);

    const user = User.create({
      id: authUser.id,
      email: new Email(authUser.email),
      fullName: params.fullName,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.userRepo.save(user);

    const org = Organization.createPersonal(
      this.idGenerator.generate(),
      params.fullName ?? params.email.split("@")[0]!,
      user.id,
      this.idGenerator.generate(),
    );

    await this.orgRepo.save(org);

    const orgPrimitives = org.toPrimitives();
    await this.eventBus.publish([
      new UserSignedUpEvent(user.id, params.email),
      new OrganizationCreatedEvent(
        org.id,
        orgPrimitives.slug,
        OrgType.INDIVIDUAL,
        user.id,
      ),
    ]);

    return user;
  }
}

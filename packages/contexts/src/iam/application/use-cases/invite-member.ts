import type { EventBus } from "../../../_shared/domain/events/event-bus.js";
import { Invitation } from "../../domain/entities/invitation.js";
import { MemberInvitedEvent } from "../../domain/events/member-invited.event.js";
import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error.js";
import { AlreadyMemberError } from "../../domain/errors/already-member.error.js";
import { Email } from "../../domain/value-objects/email.js";
import { MemberRole } from "../../domain/value-objects/member-role.js";
import type { IdGenerator } from "../../../_shared/domain/models/id-generator.js";
import type { TokenGenerator } from "../../ports/services/token-generator.js";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository.js";
import type { InvitationRepository } from "../../ports/repositories/invitation-repository.js";
import type { UserRepository } from "../../ports/repositories/user-repository.js";
import type { EmailService } from "../../../_shared/domain/models/email-service.js";
import { Mail } from "../../../_shared/domain/models/mail.js";

interface InviteMemberParams {
  organizationId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
}

export class InviteMember {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly userRepo: UserRepository,
    private readonly emailService: EmailService,
    private readonly idGenerator: IdGenerator,
    private readonly tokenGenerator: TokenGenerator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: InviteMemberParams): Promise<Invitation> {
    const org = await this.orgRepo.findById(params.organizationId);
    if (!org) throw new OrganizationNotFoundError(params.organizationId);

    if (!org.canMemberManage(params.invitedBy)) {
      throw new Error("You do not have permission to invite members");
    }

    const email = new Email(params.email);
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser && org.hasMember(existingUser.id)) {
      throw new AlreadyMemberError(existingUser.id, params.organizationId);
    }

    const token = this.tokenGenerator.generate();
    const invitation = Invitation.create({
      id: this.idGenerator.generate(),
      organizationId: params.organizationId,
      email,
      role: params.role,
      token,
      invitedBy: params.invitedBy,
    });

    await this.invitationRepo.save(invitation);

    const orgPrimitives = org.toPrimitives();
    const inviter = await this.userRepo.findById(params.invitedBy);
    const inviterName = inviter ? inviter.toPrimitives().fullName ?? "A team member" : "A team member";

    await this.emailService.send(
      Mail.create({
        to: params.email,
        subject: `You've been invited to join ${orgPrimitives.name}`,
        body: `${inviterName} invited you to join ${orgPrimitives.name}. Use this token to accept: ${token}`,
      }),
    );

    await this.eventBus.publish([
      new MemberInvitedEvent(
        params.organizationId,
        params.email,
        params.role,
        params.invitedBy,
        token,
      ),
    ]);

    return invitation;
  }
}

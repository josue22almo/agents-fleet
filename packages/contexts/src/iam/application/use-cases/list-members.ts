import { OrganizationNotFoundError } from "../../domain/errors/organization-not-found.error";
import { MemberSummary } from "../../domain/read-models/member-summary";
import type { MemberRole } from "../../domain/value-objects/member-role";
import type { OrganizationRepository } from "../../ports/repositories/organization-repository";
import type { UserRepository } from "../../ports/repositories/user-repository";

export class ListMembers {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(organizationId: string, requestedBy: string): Promise<MemberSummary[]> {
    const org = await this.orgRepo.findById(organizationId);
    if (!org) throw new OrganizationNotFoundError(organizationId);

    if (!org.hasMember(requestedBy)) {
      throw new OrganizationNotFoundError(organizationId);
    }

    const orgPrimitives = org.toPrimitives();
    const summaries: MemberSummary[] = [];

    for (const member of orgPrimitives.members) {
      const user = await this.userRepo.findById(member.userId);
      const userPrimitives = user?.toPrimitives();

      summaries.push(
        MemberSummary.create({
          id: member.id,
          userId: member.userId,
          email: userPrimitives?.email ?? "",
          fullName: userPrimitives?.fullName ?? null,
          avatarUrl: userPrimitives?.avatarUrl ?? null,
          role: member.role as MemberRole,
          joinedAt: member.createdAt,
        }),
      );
    }

    return summaries;
  }
}

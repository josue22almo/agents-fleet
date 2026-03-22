import { Entity } from "../../../_shared/domain/models/entity";
import { AlreadyMemberError } from "../errors/already-member.error";
import { InsufficientPermissionsError } from "../../../_shared/domain/errors/insufficient-permissions.error";
import { MemberRole } from "../value-objects/member-role";
import { OrgType } from "../value-objects/org-type";
import { Slug } from "../value-objects/slug";
import { OrganizationMember } from "./organization-member";

interface OrganizationProps {
  id: string;
  name: string;
  slug: Slug;
  type: OrgType;
  createdAt: Date;
  updatedAt: Date;
  members?: OrganizationMember[];
}

export class Organization extends Entity {
  private _name: string;
  private _slug: Slug;
  private _type: OrgType;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _members: OrganizationMember[];

  private constructor(props: OrganizationProps) {
    super(props.id);
    this._name = props.name;
    this._slug = props.slug;
    this._type = props.type;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._members = props.members ?? [];
  }

  get isPersonal(): boolean {
    return this._type === OrgType.INDIVIDUAL;
  }

  get isTeam(): boolean {
    return this._type === OrgType.TEAM;
  }

  get memberCount(): number {
    return this._members.length;
  }

  updateDetails(name: string, slug: Slug, updatedBy: string): void {
    this.assertCanManage(updatedBy);
    this._name = name;
    this._slug = slug;
    this._updatedAt = new Date();
  }

  addMember(
    memberId: string,
    userId: string,
    role: MemberRole,
  ): OrganizationMember {
    if (this.hasMember(userId)) {
      throw new AlreadyMemberError(userId, this.id);
    }
    const member = OrganizationMember.create({
      id: memberId,
      organizationId: this.id,
      userId,
      role,
      createdAt: new Date(),
    });
    this._members.push(member);
    return member;
  }

  removeMember(userId: string, removedBy: string): void {
    this.assertIsOwner(removedBy);
    const index = this._members.findIndex((m) => m.belongsTo(userId));
    if (index === -1) return;
    this._members.splice(index, 1);
  }

  changeMemberRole(
    userId: string,
    newRole: MemberRole,
    changedBy: string,
  ): void {
    this.assertCanManage(changedBy);
    const member = this.findMember(userId);
    if (!member) return;
    member.changeRole(newRole);
  }

  hasMember(userId: string): boolean {
    return this._members.some((m) => m.belongsTo(userId));
  }

  isMemberOwner(userId: string): boolean {
    const member = this.findMember(userId);
    return member?.isOwner ?? false;
  }

  isMemberAdmin(userId: string): boolean {
    const member = this.findMember(userId);
    return member?.isAdmin ?? false;
  }

  canMemberManage(userId: string): boolean {
    const member = this.findMember(userId);
    return member?.canManage ?? false;
  }

  private findMember(userId: string): OrganizationMember | undefined {
    return this._members.find((m) => m.belongsTo(userId));
  }

  private assertCanManage(userId: string): void {
    if (!this.canMemberManage(userId)) {
      throw new InsufficientPermissionsError("manage this organization");
    }
  }

  private assertIsOwner(userId: string): void {
    if (!this.isMemberOwner(userId)) {
      throw new InsufficientPermissionsError("perform this owner action");
    }
  }

  toPrimitives() {
    return {
      id: this.id,
      name: this._name,
      slug: this._slug.value,
      type: this._type,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      members: this._members.map((m) => m.toPrimitives()),
    };
  }

  static create(props: OrganizationProps): Organization {
    return new Organization(props);
  }

  static createPersonal(
    id: string,
    name: string,
    ownerId: string,
    memberId: string,
  ): Organization {
    const org = new Organization({
      id,
      name: `${name}'s Space`,
      slug: Slug.fromName(`${name}-personal-${ownerId.substring(0, 8)}`),
      type: OrgType.INDIVIDUAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org.addMember(memberId, ownerId, MemberRole.OWNER);
    return org;
  }
}

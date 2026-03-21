import { Entity } from "../../../_shared/domain/models/entity";
import { MemberRole } from "../value-objects/member-role";

interface OrganizationMemberProps {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  createdAt: Date;
}

export class OrganizationMember extends Entity {
  private _organizationId: string;
  private _userId: string;
  private _role: MemberRole;
  private _createdAt: Date;

  private constructor(props: OrganizationMemberProps) {
    super(props.id);
    this._organizationId = props.organizationId;
    this._userId = props.userId;
    this._role = props.role;
    this._createdAt = props.createdAt;
  }

  belongsTo(userId: string): boolean {
    return this._userId === userId;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this._organizationId === organizationId;
  }

  get isOwner(): boolean {
    return this._role === MemberRole.OWNER;
  }

  get isAdmin(): boolean {
    return this._role === MemberRole.ADMIN;
  }

  get isMember(): boolean {
    return this._role === MemberRole.MEMBER;
  }

  get canManage(): boolean {
    return this.isOwner || this.isAdmin;
  }

  changeRole(newRole: MemberRole): void {
    this._role = newRole;
  }

  toPrimitives() {
    return {
      id: this.id,
      organizationId: this._organizationId,
      userId: this._userId,
      role: this._role,
      createdAt: this._createdAt,
    };
  }

  static create(props: OrganizationMemberProps): OrganizationMember {
    return new OrganizationMember(props);
  }
}

import { MemberRole } from "../value-objects/member-role.js";
import { OrgType } from "../value-objects/org-type.js";

interface OrganizationSummaryProps {
  id: string;
  name: string;
  slug: string;
  type: OrgType;
  memberCount: number;
  currentUserRole: MemberRole;
}

export class OrganizationSummary {
  private _id: string;
  private _name: string;
  private _slug: string;
  private _type: OrgType;
  private _memberCount: number;
  private _currentUserRole: MemberRole;

  private constructor(props: OrganizationSummaryProps) {
    this._id = props.id;
    this._name = props.name;
    this._slug = props.slug;
    this._type = props.type;
    this._memberCount = props.memberCount;
    this._currentUserRole = props.currentUserRole;
  }

  get isPersonal(): boolean {
    return this._type === OrgType.INDIVIDUAL;
  }

  get isTeam(): boolean {
    return this._type === OrgType.TEAM;
  }

  get canCurrentUserManage(): boolean {
    return (
      this._currentUserRole === MemberRole.OWNER ||
      this._currentUserRole === MemberRole.ADMIN
    );
  }

  toPrimitives() {
    return {
      id: this._id,
      name: this._name,
      slug: this._slug,
      type: this._type,
      memberCount: this._memberCount,
      canCurrentUserManage: this.canCurrentUserManage,
    };
  }

  static create(props: OrganizationSummaryProps): OrganizationSummary {
    return new OrganizationSummary(props);
  }
}

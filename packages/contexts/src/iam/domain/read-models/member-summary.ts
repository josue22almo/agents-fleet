import { MemberRole } from "../value-objects/member-role";

interface MemberSummaryProps {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: Date;
}

export class MemberSummary {
  private _id: string;
  private _userId: string;
  private _email: string;
  private _fullName: string | null;
  private _avatarUrl: string | null;
  private _role: MemberRole;
  private _joinedAt: Date;

  private constructor(props: MemberSummaryProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._email = props.email;
    this._fullName = props.fullName;
    this._avatarUrl = props.avatarUrl;
    this._role = props.role;
    this._joinedAt = props.joinedAt;
  }

  get isOwner(): boolean {
    return this._role === MemberRole.OWNER;
  }

  get isAdmin(): boolean {
    return this._role === MemberRole.ADMIN;
  }

  get canManage(): boolean {
    return this.isOwner || this.isAdmin;
  }

  toPrimitives() {
    return {
      id: this._id,
      userId: this._userId,
      email: this._email,
      fullName: this._fullName,
      avatarUrl: this._avatarUrl,
      isOwner: this.isOwner,
      isAdmin: this.isAdmin,
      canManage: this.canManage,
      joinedAt: this._joinedAt,
    };
  }

  static create(props: MemberSummaryProps): MemberSummary {
    return new MemberSummary(props);
  }
}

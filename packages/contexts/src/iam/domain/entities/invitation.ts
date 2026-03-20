import { Entity } from "../../../_shared/domain/models/entity.js";
import { InvitationExpiredError } from "../errors/invitation-expired.error.js";
import { Email } from "../value-objects/email.js";
import { MemberRole } from "../value-objects/member-role.js";

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

interface InvitationProps {
  id: string;
  organizationId: string;
  email: Email;
  role: MemberRole;
  token: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
}

export class Invitation extends Entity {
  private _organizationId: string;
  private _email: Email;
  private _role: MemberRole;
  private _token: string;
  private _invitedBy: string;
  private _status: InvitationStatus;
  private _expiresAt: Date;
  private _createdAt: Date;

  private static readonly EXPIRATION_DAYS = 7;

  private constructor(props: InvitationProps) {
    super(props.id);
    this._organizationId = props.organizationId;
    this._email = props.email;
    this._role = props.role;
    this._token = props.token;
    this._invitedBy = props.invitedBy;
    this._status = props.status;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt;
  }

  get isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  get isPending(): boolean {
    return this._status === InvitationStatus.PENDING && !this.isExpired;
  }

  get isAccepted(): boolean {
    return this._status === InvitationStatus.ACCEPTED;
  }

  get isDeclined(): boolean {
    return this._status === InvitationStatus.DECLINED;
  }

  isForEmail(email: Email): boolean {
    return this._email.equals(email);
  }

  hasToken(token: string): boolean {
    return this._token === token;
  }

  belongsToOrganization(organizationId: string): boolean {
    return this._organizationId === organizationId;
  }

  accept(): void {
    this.assertCanRespond();
    this._status = InvitationStatus.ACCEPTED;
  }

  decline(): void {
    this.assertCanRespond();
    this._status = InvitationStatus.DECLINED;
  }

  private assertCanRespond(): void {
    if (this.isExpired) {
      throw new InvitationExpiredError(this._token);
    }
    if (this._status !== InvitationStatus.PENDING) {
      throw new Error(`Invitation has already been ${this._status}`);
    }
  }

  toPrimitives() {
    return {
      id: this.id,
      organizationId: this._organizationId,
      email: this._email.value,
      role: this._role,
      token: this._token,
      invitedBy: this._invitedBy,
      status: this._status,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
    };
  }

  static create(
    props: Omit<InvitationProps, "status" | "expiresAt" | "createdAt">,
  ): Invitation {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + Invitation.EXPIRATION_DAYS);

    return new Invitation({
      ...props,
      status: InvitationStatus.PENDING,
      expiresAt,
      createdAt: now,
    });
  }

  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(props);
  }
}

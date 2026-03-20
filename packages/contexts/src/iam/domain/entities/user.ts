import { Entity } from "../../../_shared/domain/models/entity.js";
import { Email } from "../value-objects/email.js";

interface UserProps {
  id: string;
  email: Email;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Entity {
  private _email: Email;
  private _fullName: string | null;
  private _avatarUrl: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this._email = props.email;
    this._fullName = props.fullName;
    this._avatarUrl = props.avatarUrl;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  hasEmail(email: Email): boolean {
    return this._email.equals(email);
  }

  updateProfile(fullName: string | null, avatarUrl: string | null): void {
    this._fullName = fullName;
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  toPrimitives() {
    return {
      id: this.id,
      email: this._email.value,
      fullName: this._fullName,
      avatarUrl: this._avatarUrl,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  static create(props: UserProps): User {
    return new User(props);
  }
}

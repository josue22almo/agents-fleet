import { ValueObject } from "../../../_shared/domain/models/value-object";

export class Email extends ValueObject<string> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  protected validate(value: string): void {
    if (!Email.EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email: "${value}"`);
    }
  }
}

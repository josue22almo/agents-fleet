import type { User } from "../../domain/entities/user";
import type { Email } from "../../domain/value-objects/email";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}

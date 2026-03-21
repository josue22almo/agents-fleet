import type { User } from "../../domain/entities/user";
import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { UserRepository } from "../../ports/repositories/user-repository";

export class GetProfile {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return user;
  }
}

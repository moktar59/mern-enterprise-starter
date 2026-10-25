import type { AuthUser } from "./user.js";
export interface CreateAuthUserInput {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
}
export interface UserRepository {
  findByEmail(e: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  create(i: CreateAuthUserInput): Promise<AuthUser>;
}
export class UserEmailConflictError extends Error {
  constructor() {
    super("Email already exists.");
    this.name = "UserEmailConflictError";
  }
}
export class UserPersistenceError extends Error {
  constructor() {
    super("User persistence operation failed.");
    this.name = "UserPersistenceError";
  }
}

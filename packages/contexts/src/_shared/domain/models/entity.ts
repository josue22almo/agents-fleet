export abstract class Entity<T extends string = string> {
  constructor(readonly id: T) {}

  abstract toPrimitives(): Record<string, unknown>;

  equals(other: Entity<T>): boolean {
    return this.id === other.id;
  }
}

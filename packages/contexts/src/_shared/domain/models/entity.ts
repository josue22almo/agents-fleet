export abstract class Entity<T extends string = string> {
  constructor(readonly id: T) {}

  equals(other: Entity<T>): boolean {
    return this.id === other.id;
  }
}

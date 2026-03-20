export interface WithPrimitives {
  toPrimitives(): Record<string, unknown>;
}

export type PrimitiveOf<T extends WithPrimitives> = ReturnType<T["toPrimitives"]>;

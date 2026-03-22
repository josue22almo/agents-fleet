import { createHash, randomBytes } from "node:crypto";

export class ConnectionToken {
  private constructor(
    readonly value: string,
    readonly hash: string,
    readonly prefix: string,
  ) {}

  static generate(): ConnectionToken {
    const raw = "af_" + randomBytes(32).toString("base64url");
    const hash = createHash("sha256").update(raw).digest("hex");
    const prefix = raw.substring(0, 11);
    return new ConnectionToken(raw, hash, prefix);
  }

  static hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  static verify(value: string, hash: string): boolean {
    return ConnectionToken.hashValue(value) === hash;
  }

  static fromStored(hash: string, prefix: string): ConnectionToken {
    return new ConnectionToken("", hash, prefix);
  }
}

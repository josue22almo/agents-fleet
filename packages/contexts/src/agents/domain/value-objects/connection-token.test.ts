import { describe, it, expect } from "vitest";
import { ConnectionToken } from "./connection-token";

describe("ConnectionToken", () => {
  it("generates a token with af_ prefix", () => {
    const token = ConnectionToken.generate();
    expect(token.value).toMatch(/^af_/);
  });

  it("hashes the token with SHA-256", () => {
    const token = ConnectionToken.generate();
    expect(token.hash).not.toBe(token.value);
    expect(token.hash.length).toBe(64); // SHA-256 hex
  });

  it("extracts prefix for display", () => {
    const token = ConnectionToken.generate();
    expect(token.prefix.length).toBe(11); // "af_" + 8 chars
  });

  it("verifies a token against its hash", () => {
    const token = ConnectionToken.generate();
    expect(ConnectionToken.verify(token.value, token.hash)).toBe(true);
    expect(ConnectionToken.verify("wrong", token.hash)).toBe(false);
  });

  it("creates from stored hash and prefix", () => {
    const token = ConnectionToken.generate();
    const stored = ConnectionToken.fromStored(token.hash, token.prefix);
    expect(stored.hash).toBe(token.hash);
    expect(stored.prefix).toBe(token.prefix);
    expect(stored.value).toBe("");
  });

  it("hashes a value consistently", () => {
    const token = ConnectionToken.generate();
    const rehashed = ConnectionToken.hashValue(token.value);
    expect(rehashed).toBe(token.hash);
  });
});

import { describe, it, expect } from "vitest";
import { DomainError } from "./domain-error";

class TestError extends DomainError {
  readonly code = "TEST_ERROR";

  constructor() {
    super("Something went wrong");
  }
}

describe("DomainError", () => {
  it("is an instance of Error", () => {
    const error = new TestError();
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });

  it("has the correct name, message, and code", () => {
    const error = new TestError();
    expect(error.name).toBe("TestError");
    expect(error.message).toBe("Something went wrong");
    expect(error.code).toBe("TEST_ERROR");
  });
});

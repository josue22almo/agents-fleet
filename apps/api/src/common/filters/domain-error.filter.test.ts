import { describe, it, expect } from "vitest";
import { HttpStatus } from "@nestjs/common";
import {
  UserNotFoundError,
  OrganizationNotFoundError,
  SlugAlreadyTakenError,
  AlreadyMemberError,
  InsufficientPermissionsError,
  InvalidTokenError,
  InvitationExpiredError,
  InvitationAlreadyRespondedError,
} from "@repo/contexts/iam";
import { DomainErrorFilter } from "./domain-error.filter";

function createMockHost(responseSpy: { status: number; body: unknown }) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (code: number) => {
          responseSpy.status = code;
          return {
            json: (body: unknown) => {
              responseSpy.body = body;
            },
          };
        },
      }),
    }),
  } as any;
}

const silentLogger = { log: () => {}, error: () => {}, warn: () => {}, debug: () => {}, verbose: () => {} };

describe("DomainErrorFilter", () => {
  const filter = new DomainErrorFilter(silentLogger);

  const cases: [string, () => InstanceType<any>, number][] = [
    ["UserNotFoundError", () => new UserNotFoundError("u1"), HttpStatus.NOT_FOUND],
    ["OrganizationNotFoundError", () => new OrganizationNotFoundError("o1"), HttpStatus.NOT_FOUND],
    ["SlugAlreadyTakenError", () => new SlugAlreadyTakenError("slug"), HttpStatus.CONFLICT],
    ["AlreadyMemberError", () => new AlreadyMemberError("u1", "o1"), HttpStatus.CONFLICT],
    ["InsufficientPermissionsError", () => new InsufficientPermissionsError(), HttpStatus.FORBIDDEN],
    ["InvalidTokenError", () => new InvalidTokenError(), HttpStatus.UNAUTHORIZED],
    ["InvitationExpiredError", () => new InvitationExpiredError("token"), HttpStatus.GONE],
    ["InvitationAlreadyRespondedError", () => new InvitationAlreadyRespondedError("accepted"), HttpStatus.CONFLICT],
  ];

  it.each(cases)("maps %s to HTTP %i", (name, createError, expectedStatus) => {
    const error = createError();
    const response = { status: 0, body: null as unknown };
    filter.catch(error, createMockHost(response));

    expect(response.status).toBe(expectedStatus);
    expect((response.body as any).error.code).toBe(error.code);
    expect((response.body as any).error.message).toBe(error.message);
  });
});

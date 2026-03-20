# Backend Architecture

## Table of Contents

- [Principles](#principles)
- [Layers](#layers)
- [Package Structure](#package-structure)
- [Dependency Flow](#dependency-flow)
- [Conventions](#conventions)
- [Event-Driven Architecture](#event-driven-architecture)
- [Error Handling](#error-handling)
- [Testing Strategy](#testing-strategy)
- [Shared Contracts](#shared-contracts-packagescontracts)
- [Authentication](#authentication)
- [Future Contexts](#future-contexts)

## Principles

- **DDD (Domain-Driven Design)**: Code is organized by bounded contexts, not technical layers
- **Hexagonal Architecture**: Inner layers (domain, application) depend on port interfaces, never on infrastructure implementations
- **Dependency Rule**: Domain → nothing. Application → Domain + Ports. Apps (infrastructure) → everything
- **Framework-free contexts**: The contexts package has zero dependencies on NestJS or any framework. Pure TypeScript only. Any app (HTTP API, CLI, worker) can consume the same use cases

## Layers

### Domain

The innermost layer. Contains entities, value objects, domain events, and domain errors. Has **zero dependencies** on any framework, library, or external service.

- Entities have rich behavior (methods enforce business rules)
- Value objects are immutable and validate on construction
- Domain errors represent business rule violations

### Application (Use Cases)

Orchestrates domain entities to fulfill a user action. Depends on domain and port interfaces, never on infrastructure.

- One class per use case (single responsibility)
- Receives dependencies via constructor injection (ports)
- **Returns domain objects** — always, including list/query use cases. The app layer (controllers, CLI) is responsible for mapping to its output format (JSON, table, etc.). This keeps use cases delivery-agnostic
- For collections, use cases return read models (domain-level projections) that are still part of the domain, not infrastructure DTOs. This keeps the pattern consistent across commands and queries

### Ports

Interfaces (contracts) that define what the application layer needs from the outside world. Declared alongside the context they belong to.

- **Repository ports**: data persistence contracts
- **Service ports**: external service contracts (auth, email, etc.)
- **Event bus port**: publish/subscribe contract for domain events

### Infrastructure

Split across two locations:

**In contexts** — port implementations that are reusable across apps:

- Repository implementations (e.g., Supabase)
- External service adapters (email, auth providers)

**In apps** — delivery mechanisms and framework wiring, specific to each app:

- Controllers (NestJS HTTP adapters)
- CLI commands
- Framework modules (NestJS modules that wire ports → adapters)
- Guards, middleware, and other framework-specific concerns

## Package Structure

### Contexts package

`packages/contexts` contains domain, application, ports, and their infrastructure implementations. **No framework dependencies** (no NestJS decorators, no Express). May depend on libraries for port implementations (e.g., `@supabase/supabase-js`), but never on delivery frameworks.

```
packages/contexts/
  src/
    _shared/                            # Shared base classes across all contexts
      domain/
        domain-event.ts                 # base DomainEvent class
        entity.ts                       # base Entity class (id, equals, etc.)
        value-object.ts                 # base ValueObject class
        errors/
          domain-error.ts               # base domain error
      ports/
        event-bus.ts                    # EventBus & EventHandler interfaces
      infrastructure/
        in-memory-event-bus.ts          # default in-process implementation

    iam/                              # Identity & Access Management context
      domain/
        entities/
          user.ts                     # User entity
          organization.ts             # Organization entity (rich model)
          organization-member.ts      # OrganizationMember entity
          invitation.ts               # Invitation entity
        value-objects/
          email.ts
          member-role.ts              # owner | admin | member
          org-type.ts                 # individual | team
          slug.ts
        read-models/
          organization-summary.ts     # read-optimized projection for lists
          member-summary.ts
        errors/
          user-not-found.ts
          slug-already-taken.ts
          insufficient-permissions.ts
        events/                       # domain events (extend _shared/DomainEvent)
          user-signed-up.ts
          organization-created.ts
          member-invited.ts
          invitation-accepted.ts

      application/
        event-handlers/
          on-member-invited.event-handler.ts
        use-cases/
          sign-up.ts
          login.ts
          reset-password.ts
          update-profile.ts
          create-organization.ts
          update-organization.ts
          delete-organization.ts
          invite-member.ts
          accept-invitation.ts
          decline-invitation.ts
          change-member-role.ts
          remove-member.ts
          list-organizations.ts
          list-members.ts

      ports/
        repositories/
          user-repository.ts          # interface
          organization-repository.ts  # interface
          invitation-repository.ts    # interface
        services/
          auth-service.ts             # interface (token validation abstraction)
          email-service.ts            # interface (send invite emails, etc.)

      infrastructure/
        persistence/
          supabase-user.repository.ts
          supabase-organization.repository.ts
          supabase-invitation.repository.ts
        services/
          supabase-auth.service.ts
          smtp-email.service.ts

      index.ts                        # public API of the context
```

### API app (NestJS — delivery mechanism + wiring)

`apps/api` owns controllers, guards, NestJS modules, and framework-specific concerns. It imports use cases and infrastructure from contexts and wires them together.

```
apps/api/
  src/
    main.ts                           # bootstrap NestJS app
    app.module.ts                     # imports all feature modules

    shared/
      supabase/
        supabase-request-client.ts    # request-scoped Supabase client (JWT → RLS)
        supabase.module.ts            # provides SupabaseRequestClient

    iam/
      controllers/
        auth.controller.ts
        organizations.controller.ts
        members.controller.ts
        invitations.controller.ts
      guards/
        jwt-auth.guard.ts
        org-membership.guard.ts
      iam.module.ts                   # wires context ports → context adapters, registers controllers
```

### Example: CLI app reusing the same contexts

Because contexts own their infrastructure, a CLI app reuses the same use cases **and** the same adapters — it only provides its own delivery layer (commands) and wiring:

```
apps/cli/
  src/
    main.ts                           # CLI entrypoint (e.g., Commander.js)
    commands/
      create-org.command.ts           # uses CreateOrganization use case
      list-orgs.command.ts            # uses ListOrganizations use case
    wiring.ts                         # manually wires context ports → context adapters
```

### How the API App Wires Contexts

```typescript
// apps/api/src/iam/iam.module.ts
import { CreateOrganization, OrganizationRepository, SupabaseOrganizationRepository } from '@repo/contexts/iam';

@Module({
  imports: [SupabaseModule],
  controllers: [AuthController, OrganizationsController, MembersController],
  providers: [
    // Bind port → adapter
    {
      provide: 'OrganizationRepository',
      useClass: SupabaseOrganizationRepository,
    },
    // Register use cases
    {
      provide: CreateOrganization,
      useFactory: (orgRepo: OrganizationRepository) => new CreateOrganization(orgRepo),
      inject: ['OrganizationRepository'],
    },
  ],
})
export class IamModule {}

// apps/api/src/app.module.ts
@Module({
  imports: [IamModule],
})
export class AppModule {}
```

## Dependency Flow

```
┌──────────────────────────────────────────────────────────┐
│               Apps (apps/api, apps/cli, etc.)            │
│  controllers, guards, CLI commands, NestJS modules       │
│  Wires context ports → context adapters                  │
│                                                           │
│  depends on ↓                                             │
├──────────────────────────────────────────────────────────┤
│     Contexts (packages/contexts) — NO DELIVERY FRAMEWORK  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Infrastructure                       │    │
│  │  (supabase repos, email adapters, auth service)  │    │
│  │                                                   │    │
│  │  implements ↓                                     │    │
│  ├──────────────────────────────────────────────────┤    │
│  │          Application (Use Cases)                  │    │
│  │  (sign-up, create-org, invite-member)            │    │
│  │                                                   │    │
│  │  depends on ↓                                     │    │
│  ├──────────────────────────────────────────────────┤    │
│  │        Domain + Ports (interfaces)                │    │
│  │  (entities, value objects, repository ports)      │    │
│  │                                                   │    │
│  │  depends on → nothing                             │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Conventions

### Naming

- Use cases: verb-noun (e.g., `CreateOrganization`, `InviteMember`)
- Domain events: `{context}.{entity}.{past_tense_verb}` (e.g., `iam.organization.created`, `iam.member.invited`, `iam.invitation.accepted`). Always past tense — events describe something that already happened
- Event handlers: `On{Event}EventHandler` (e.g., `OnMemberInvitedEventHandler`, `OnOrganizationCreatedEventHandler`)
- Port interfaces: `{Entity}Repository`, `AuthService`, `EmailService`
- Implementations (in contexts): `Supabase{Entity}Repository`, `SmtpEmailService`
- Controllers (in apps): `{Resource}Controller`
- Guards (in apps): `{Concern}Guard`

### Use Case Pattern

```typescript
// ports/repositories/organization-repository.ts
export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByUserId(userId: string): Promise<Organization[]>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}

// application/use-cases/create-organization.ts
export class CreateOrganization {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
  ) {}

  async execute(params: { name: string; slug: string; ownerId: string }): Promise<Organization> {
    const existing = await this.organizationRepo.findBySlug(params.slug);
    if (existing) {
      throw new SlugAlreadyTakenError(params.slug);
    }

    const organization = Organization.createTeam({
      name: params.name,
      slug: params.slug,
      ownerId: params.ownerId,
    });

    await this.organizationRepo.save(organization);
    return organization;
  }
}
```

### Rich Domain Entity Pattern

```typescript
// domain/entities/organization.ts
export class Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly type: OrgType;
  private members: OrganizationMember[];

  static createPersonal(params: { name: string; ownerId: string }): Organization { /* ... */ }
  static createTeam(params: { name: string; slug: string; ownerId: string }): Organization { /* ... */ }

  addMember(userId: string, role: MemberRole): OrganizationMember {
    if (this.hasMember(userId)) {
      throw new AlreadyMemberError(userId, this.id);
    }
    const member = OrganizationMember.create({
      organizationId: this.id,
      userId,
      role,
    });
    this.members.push(member);
    return member;
  }

  removeMember(userId: string, removedBy: string): void {
    const remover = this.getMember(removedBy);
    if (remover.role !== MemberRole.OWNER) {
      throw new InsufficientPermissionsError();
    }
    this.members = this.members.filter(m => m.userId !== userId);
  }

  isOwner(userId: string): boolean { /* ... */ }
  isAdminOrAbove(userId: string): boolean { /* ... */ }
  hasMember(userId: string): boolean { /* ... */ }
}
```

### Read Models (for queries/lists)

Read models are domain-level projections used by query use cases. They live in the domain layer alongside entities but represent a read-optimized view. Controllers/CLI map them to their output format just like any other domain object.

```typescript
// domain/read-models/organization-summary.ts
export class OrganizationSummary {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
    readonly type: OrgType,
    readonly memberCount: number,
    readonly userRole: MemberRole,
  ) {}
}

// ports/repositories/organization-repository.ts
export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByUserId(userId: string): Promise<OrganizationSummary[]>;
  save(organization: Organization): Promise<void>;
  delete(id: string): Promise<void>;
}

// application/use-cases/list-organizations.ts
export class ListOrganizations {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async execute(userId: string): Promise<OrganizationSummary[]> {
    return this.orgRepo.findByUserId(userId);
  }
}

// Controller maps to JSON — that's the app's job
@Get()
async list(@CurrentUser() user) {
  const orgs = await this.listOrganizations.execute(user.id);
  return orgs.map(org => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    member_count: org.memberCount,
    your_role: org.userRole,
  }));
}

// CLI maps to table — same use case, different output
async run(userId: string) {
  const orgs = await this.listOrganizations.execute(userId);
  console.table(orgs.map(o => ({ Name: o.name, Type: o.type, Role: o.userRole })));
}
```

## Event-Driven Architecture

Use cases can be triggered by HTTP requests, CLI commands, **or domain events**. This enables reactive workflows across contexts without coupling them.

### Event Bus Port (in `_shared`)

```typescript
// _shared/domain/domain-event.ts
export abstract class DomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date = new Date();
  abstract readonly payload: Record<string, unknown>;
}

// _shared/ports/event-bus.ts
export abstract class EventHandler<T extends DomainEvent = DomainEvent> {
  abstract readonly subscribedTo: string;  // event name this handler listens to
  abstract handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  register(handler: EventHandler): void;
}
```

### Event Handlers

Event handlers live in the context that reacts to the event. They receive dependencies via constructor (same as use cases) and declare which event they subscribe to.

```typescript
// monitoring/application/event-handlers/on-organization-created.ts
export class OnOrganizationCreatedEventHandler extends EventHandler<OrganizationCreated> {
  readonly subscribedTo = 'iam.organization.created';

  constructor(private readonly dashboardRepo: DashboardRepository) {}

  async handle(event: OrganizationCreated): Promise<void> {
    const dashboard = Dashboard.createDefault(event.payload.organizationId);
    await this.dashboardRepo.save(dashboard);
  }
}

// iam/application/event-handlers/on-member-invited.ts
export class OnMemberInvitedEventHandler extends EventHandler<MemberInvited> {
  readonly subscribedTo = 'iam.member.invited';

  constructor(private readonly emailService: EmailService) {}

  async handle(event: MemberInvited): Promise<void> {
    await this.emailService.sendInvite({
      invitationId: event.payload.invitationId,
      email: event.payload.email,
      organizationName: event.payload.organizationName,
    });
  }
}
```

### Use Cases Publish Events

Use cases publish domain events after completing their work. They depend on the `EventBus` port, not on any subscriber.

```typescript
// domain/events/organization-created.ts
export class OrganizationCreated extends DomainEvent {
  readonly eventName = 'iam.organization.created';

  constructor(readonly payload: {
    organizationId: string;
    name: string;
    ownerId: string;
    type: string;
  }) {}
}

// application/use-cases/create-organization.ts
export class CreateOrganization {
  constructor(
    private readonly organizationRepo: OrganizationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: { name: string; slug: string; ownerId: string }): Promise<Organization> {
    const organization = Organization.createTeam({ ...params });
    await this.organizationRepo.save(organization);

    await this.eventBus.publish(new OrganizationCreated({
      organizationId: organization.id,
      name: organization.name,
      ownerId: params.ownerId,
      type: organization.type,
    }));

    return organization;
  }
}
```

### Apps Register Handlers

The app instantiates handlers with their dependencies and registers them on the event bus. Contexts stay decoupled — they don't know about each other.

```typescript
// apps/api/src/event-subscriptions.ts
export function registerEventHandlers(
  eventBus: EventBus,
  dashboardRepo: DashboardRepository,
  emailService: EmailService,
) {
  eventBus.register(new OnOrganizationCreatedEventHandler(dashboardRepo));
  eventBus.register(new OnMemberInvitedEventHandler(emailService));
}
```

### Event Bus Implementation Example

```typescript
// _shared/infrastructure/in-memory-event-bus.ts
export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  register(handler: EventHandler): void {
    const existing = this.handlers.get(handler.subscribedTo) ?? [];
    existing.push(handler);
    this.handlers.set(handler.subscribedTo, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }
}
```

Full wiring example in an app:

```typescript
// apps/api/src/event-subscriptions.ts
import { InMemoryEventBus } from '@repo/contexts/_shared';
import { OnMemberInvitedEventHandler, SmtpEmailService } from '@repo/contexts/iam';
import { OnOrganizationCreatedEventHandler, SupabaseDashboardRepository } from '@repo/contexts/monitoring';

const eventBus = new InMemoryEventBus();

// IAM context: react to its own events
eventBus.register(new OnMemberInvitedEventHandler(new SmtpEmailService()));

// Monitoring context: react to IAM events
eventBus.register(new OnOrganizationCreatedEventHandler(new SupabaseDashboardRepository()));
```

### Future Event Bus Implementations

Start simple, swap later:

- **In-memory** (default): synchronous in-process bus. Good for development and single-instance deployments
- **Redis Pub/Sub** (future): for multi-instance deployments
- **SQS/RabbitMQ** (future): for durable event processing with retries

The swap is transparent — just change the adapter wired in the app module.

## Error Handling

Errors use **exceptions** (throw), not Result types. Domain entities and use cases throw domain errors for business rule violations. Apps catch and map them to the appropriate response format.

### Base Domain Error (in `_shared`)

```typescript
// _shared/domain/errors/domain-error.ts
export abstract class DomainError extends Error {
  abstract readonly code: string;  // machine-readable (e.g., 'SLUG_ALREADY_TAKEN')

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

### Context-Specific Errors

Each context defines its own errors extending `DomainError`:

```typescript
// iam/domain/errors/slug-already-taken.ts
export class SlugAlreadyTakenError extends DomainError {
  readonly code = 'SLUG_ALREADY_TAKEN';

  constructor(slug: string) {
    super(`The slug "${slug}" is already in use`);
  }
}

// iam/domain/errors/insufficient-permissions.ts
export class InsufficientPermissionsError extends DomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';

  constructor() {
    super('You do not have permission to perform this action');
  }
}

// iam/domain/errors/user-not-found.ts
export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';

  constructor(userId: string) {
    super(`User "${userId}" not found`);
  }
}
```

### Use Cases Throw, Don't Catch

Use cases let domain errors propagate — they don't try/catch business errors:

```typescript
// application/use-cases/create-organization.ts
async execute(params: { name: string; slug: string; ownerId: string }): Promise<Organization> {
  const existing = await this.organizationRepo.findBySlug(params.slug);
  if (existing) {
    throw new SlugAlreadyTakenError(params.slug);  // propagates to the app
  }
  // ...
}
```

### Apps Map Errors to Responses

Each app has a global error handler that catches `DomainError` and maps it to the appropriate response format. This is the **only place** where errors are caught and translated.

```typescript
// apps/api/src/shared/filters/domain-error.filter.ts (NestJS exception filter)
const HTTP_STATUS_MAP: Record<string, number> = {
  SLUG_ALREADY_TAKEN: 409,
  INSUFFICIENT_PERMISSIONS: 403,
  USER_NOT_FOUND: 404,
  ALREADY_MEMBER: 409,
  INVALID_TOKEN: 401,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = HTTP_STATUS_MAP[error.code] ?? 400;

    response.status(status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
}

// apps/api/src/main.ts
app.useGlobalFilters(new DomainErrorFilter());
```

The HTTP status mapping lives entirely in the app — the domain only knows about error codes.

A CLI app would map the same errors differently:

```typescript
// apps/cli/src/error-handler.ts
function handleError(error: unknown): void {
  if (error instanceof DomainError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    process.exit(1);
  }
  throw error; // unexpected error, let it crash
}
```

### Error Categories


| Error Type            | Thrown By               | Example                 | HTTP Status     |
| --------------------- | ----------------------- | ----------------------- | --------------- |
| Domain errors         | Entities, use cases     | `SlugAlreadyTakenError` | 4xx (varies)    |
| Infrastructure errors | Repos, adapters         | DB connection failure   | 500 (unhandled) |
| Validation errors     | Controllers (app layer) | Missing required field  | 400             |


- **Domain errors** are caught by the global filter and returned as structured responses
- **Infrastructure errors** are unexpected — they bubble up as 500s. No special handling needed
- **Validation errors** are app-level concerns (e.g., NestJS `ValidationPipe`) — they never reach the domain

## Testing Strategy

### Principles

- **Test behavior, not implementation** — assert what the code does, not how it's wired
- **Domain and use cases are trivially testable** — no framework, no I/O, just plain TypeScript
- **Infrastructure tests hit real services** — no mocking databases, use actual Supabase
- **Each layer has its own test type** — unit tests for domain/application, integration tests for infrastructure, e2e tests for apps

### Test Types by Layer

| Layer | Test Type | Dependencies | Speed |
|---|---|---|---|
| Domain (entities, value objects) | Unit | None | Fast |
| Application (use cases) | Unit | In-memory port stubs | Fast |
| Infrastructure (repos, adapters) | Integration | Real Supabase/SMTP | Slow |
| Apps (controllers, full stack) | E2E | Running app + real services | Slowest |

### Domain Tests

Entities and value objects are pure logic — test them directly with no setup.

```typescript
// iam/domain/entities/__tests__/organization.test.ts
describe('Organization', () => {
  it('creates a personal org with the owner as a member', () => {
    const org = Organization.createPersonal({ name: "John's Space", ownerId: 'user-1' });

    expect(org.type).toBe(OrgType.INDIVIDUAL);
    expect(org.isOwner('user-1')).toBe(true);
  });

  it('prevents adding the same member twice', () => {
    const org = Organization.createTeam({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });
    org.addMember('user-2', MemberRole.MEMBER);

    expect(() => org.addMember('user-2', MemberRole.MEMBER))
      .toThrow(AlreadyMemberError);
  });

  it('only allows owners to remove members', () => {
    const org = Organization.createTeam({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });
    org.addMember('user-2', MemberRole.MEMBER);

    expect(() => org.removeMember('user-2', 'user-2'))
      .toThrow(InsufficientPermissionsError);
  });
});
```

### Use Case Tests

Use cases are tested with **in-memory stubs** that implement the port interfaces. These stubs live in the context's test directory and are reusable across all use case tests.

```typescript
// iam/ports/repositories/__tests__/in-memory-organization.repository.ts
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private orgs: Organization[] = [];

  async findById(id: string) { return this.orgs.find(o => o.id === id) ?? null; }
  async findBySlug(slug: string) { return this.orgs.find(o => o.slug === slug) ?? null; }
  async findByUserId(userId: string) { /* ... */ }
  async save(org: Organization) { this.orgs.push(org); }
  async delete(id: string) { this.orgs = this.orgs.filter(o => o.id !== id); }
}

// iam/application/use-cases/__tests__/create-organization.test.ts
describe('CreateOrganization', () => {
  let useCase: CreateOrganization;
  let orgRepo: InMemoryOrganizationRepository;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    orgRepo = new InMemoryOrganizationRepository();
    eventBus = new InMemoryEventBus();
    useCase = new CreateOrganization(orgRepo, eventBus);
  });

  it('creates a team organization', async () => {
    const org = await useCase.execute({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });

    expect(org.name).toBe('Acme');
    expect(org.type).toBe(OrgType.TEAM);
    expect(org.isOwner('user-1')).toBe(true);
  });

  it('rejects duplicate slugs', async () => {
    await useCase.execute({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });

    await expect(useCase.execute({ name: 'Other', slug: 'acme', ownerId: 'user-2' }))
      .rejects.toThrow(SlugAlreadyTakenError);
  });

  it('publishes OrganizationCreated event', async () => {
    const published: DomainEvent[] = [];
    eventBus.register({
      subscribedTo: 'iam.organization.created',
      handle: async (event) => { published.push(event); },
    } as EventHandler);

    await useCase.execute({ name: 'Acme', slug: 'acme', ownerId: 'user-1' });

    expect(published).toHaveLength(1);
    expect(published[0].eventName).toBe('iam.organization.created');
  });
});
```

### Infrastructure Tests

Repository and service adapter tests hit **real external services**. Use a dedicated Supabase test project or local instance.

```typescript
// iam/infrastructure/persistence/__tests__/supabase-organization.repository.test.ts
describe('SupabaseOrganizationRepository', () => {
  let repo: SupabaseOrganizationRepository;

  beforeAll(() => {
    const client = createClient(process.env.SUPABASE_TEST_URL, process.env.SUPABASE_TEST_KEY);
    repo = new SupabaseOrganizationRepository(client);
  });

  afterEach(async () => {
    // clean up test data
  });

  it('saves and retrieves an organization', async () => {
    const org = Organization.createTeam({ name: 'Test Org', slug: 'test-org', ownerId: 'user-1' });
    await repo.save(org);

    const found = await repo.findBySlug('test-org');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Test Org');
  });
});
```

### E2E Tests

Full stack tests in the app — boot the NestJS server, make real HTTP requests, assert responses.

```typescript
// apps/api/src/iam/__tests__/organizations.e2e.test.ts
describe('Organizations API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalFilters(new DomainErrorFilter());
    await app.init();
  });

  it('POST /organizations creates a team org', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ name: 'Acme', slug: 'acme' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Acme');
  });

  it('POST /organizations returns 409 for duplicate slug', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ name: 'Acme', slug: 'acme' });

    const res = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ name: 'Other', slug: 'acme' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_ALREADY_TAKEN');
  });
});
```

### Test File Conventions

Tests live side by side with the file they test, using the `.test.ts` suffix:

```
domain/
  entities/
    organization.ts
    organization.test.ts
application/
  use-cases/
    create-organization.ts
    create-organization.test.ts
infrastructure/
  persistence/
    supabase-organization.repository.ts
    supabase-organization.repository.test.ts
ports/
  repositories/
    organization-repository.ts
    in-memory-organization.repository.ts   # in-memory stub for testing
    in-memory-user.repository.ts
```

### What to Test, What to Skip

- **Always test**: domain entity behavior, use case business logic, error paths
- **Always test**: infrastructure adapters against real services (catch query/mapping bugs)
- **Skip**: testing that NestJS DI wiring works (framework's job), testing pass-through controllers with no logic

### Test Runner: Vitest

All packages and apps use **Vitest**. Fast, native TypeScript support, Jest-compatible API.

```typescript
// packages/contexts/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Turborepo task config:

```jsonc
// turbo.json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "vitest.config.ts"]
    }
  }
}
```

Run tests:

```bash
pnpm run test                    # all packages
pnpm run test --filter=contexts  # just contexts
pnpm run test --filter=api       # just api (e2e)
```

## Shared Contracts (`packages/contracts`)

A shared package between API and Web containing **Zod schemas** for all API request/response shapes. Zod schemas serve as the single source of truth — TypeScript types are inferred via `z.infer<>`, no duplication.

### Rules

- Schemas define both shape and validation rules
- Types are inferred from schemas, never written manually
- Field names use **snake_case** (JSON convention for API responses)
- The API owns the mapping from domain objects (camelCase) to contract types (snake_case)
- API validates requests with `.parse()` (throws on invalid input)
- Web validates forms with `.safeParse()` (returns errors for UI display)
- If a schema changes, both API and Web get type errors at build time
- Organized by context (e.g., `src/iam/`, `src/common/`)

## Authentication

- **Web is auth-agnostic** — it knows nothing about Supabase or any auth provider. It only talks to the API via `@repo/contracts` types and `fetch`
- **API owns all auth logic** — signup, login, logout, password reset, token refresh. All Supabase Auth calls happen server-side
- **Token management** — API returns access/refresh tokens, Web stores them and sends `Authorization: Bearer <token>` on every request
- **Request-scoped Supabase client** — the API creates a per-request Supabase client initialized with the user's JWT so RLS policies apply automatically

## Future Contexts

As the product grows, new bounded contexts will follow the same structure:

```
packages/contexts/src/
  iam/           # ✅ Multi-tenant (current)
  monitoring/    # Agents, metrics, dashboards
  alerting/      # Alarms, notifications
  billing/       # Subscriptions, plans
```

Each context is independent and communicates with others through well-defined interfaces, never by reaching into another context's internals.
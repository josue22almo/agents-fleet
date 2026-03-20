# PRD: Multi-Tenant Support

**Status:** Draft
**Feature:** Multi-Tenant Support
**Priority:** P0 — Foundation for all other features

---

## Problem Statement

The agents monitoring dashboard needs to support multiple users and teams, each with isolated data. Without multi-tenancy, there's no way to separate metrics, agents, and alarms between different users or organizations. This is the foundational feature that all other features (subscriptions, agent connections, metrics, alarms) depend on.

## Goals

- Users can sign up, log in, and manage their account
- Every user gets a personal organization on signup
- Users can create team organizations and invite members
- All data is scoped to an organization — no cross-org data leakage
- Role-based access control within organizations

## Non-Goals (Out of Scope)

- Subscription plans (separate PRD)
- Agent connections (separate PRD)
- Metrics dashboard (separate PRD)
- Alarms (separate PRD)
- SSO / OAuth providers (future enhancement)
- Billing and payments

---

## User Types


| Type           | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| **Individual** | Single user with a personal organization. Default on signup. |
| **Team**       | Multiple users collaborating under a shared organization.    |


## Tenancy Model

**Org-based multi-tenancy.** Every user belongs to one or more organizations. Resources (agents, metrics, alarms) will be owned by organizations, not individual users.

- On signup, a **personal organization** (type=`individual`) is auto-created
- Users can create additional organizations (type=`team`)
- Users can be members of multiple organizations
- A user's default context is their personal org

## Tech Decisions


| Decision      | Choice                     | Rationale                                                     |
| ------------- | -------------------------- | ------------------------------------------------------------- |
| Auth provider | Supabase Auth              | Built-in with Supabase, handles sessions, JWT, email/password |
| Database      | Hosted Supabase (Postgres) | Managed service, includes RLS, realtime, auth                 |
| Tenancy model | Org-based                  | Maps naturally to individual/team user types                  |


---

## Data Model

### Enums

- **org_type**: `individual`, `team`
- **member_role**: `owner`, `admin`, `member`

### Tables

#### profiles

Extends Supabase `auth.users`. Created automatically via DB trigger on signup.


| Column     | Type        | Notes              |
| ---------- | ----------- | ------------------ |
| id         | uuid (PK)   | FK → auth.users.id |
| email      | text        | From auth.users    |
| full_name  | text        | Nullable           |
| avatar_url | text        | Nullable           |
| created_at | timestamptz | Default now()      |
| updated_at | timestamptz | Default now()      |


#### organizations


| Column     | Type          | Notes                   |
| ---------- | ------------- | ----------------------- |
| id         | uuid (PK)     |                         |
| name       | text          | Display name            |
| slug       | text (unique) | URL-friendly identifier |
| type       | org_type      | `individual` or `team`  |
| created_at | timestamptz   | Default now()           |
| updated_at | timestamptz   | Default now()           |


#### organization_members


| Column          | Type        | Notes                      |
| --------------- | ----------- | -------------------------- |
| id              | uuid (PK)   |                            |
| organization_id | uuid (FK)   | → organizations.id         |
| user_id         | uuid (FK)   | → profiles.id              |
| role            | member_role | `owner`, `admin`, `member` |
| created_at      | timestamptz | Default now()              |


**Constraints:**

- Unique on (organization_id, user_id) — a user can only be a member once per org
- Every org must have at least one owner

### DB Trigger

- On `auth.users` INSERT → create a `profiles` row + create a personal `organizations` row (type=`individual`) + add `organization_members` row (role=`owner`)

### Row-Level Security (RLS)

- **profiles**: Users can read/update their own profile
- **organizations**: Users can only see orgs they're a member of
- **organization_members**: Users can only see members of orgs they belong to
- Write policies scoped by role (owner/admin for management operations)

---

## User Stories

### Authentication

1. **As a new user**, I can sign up with email and password, and a personal org is automatically created for me
2. **As a returning user**, I can log in with email and password
3. **As a logged-in user**, I can log out
4. **As a user**, I can request a password reset email and set a new password
5. **As a logged-in user**, I can view and edit my profile (name, avatar)

### Organization Management

1. **As a user**, I can see a list of all organizations I belong to
2. **As a user**, I can create a new team organization
3. **As an org owner/admin**, I can update the organization name
4. **As a user**, I can switch between my organizations

### Member Management

1. **As an org owner/admin**, I can invite new members by email to my team org
2. **As an invited user**, I receive an email with a link to accept or decline the invitation
3. **As an invited user**, I can see who invited me, the org name, and my assigned role before accepting
4. **As an org owner/admin**, I can change a member's role (admin, member)
5. **As an org owner**, I can remove members from the org
6. **As a member**, I can leave an organization (unless I'm the sole owner)

---

## API Endpoints

### Auth


| Method | Path         | Description          | Auth          |
| ------ | ------------ | -------------------- | ------------- |
| POST   | /auth/signup | Register new user    | Public        |
| POST   | /auth/login  | Email/password login | Public        |
| POST   | /auth/forgot-password | Send password reset email | Public |
| POST   | /auth/reset-password  | Set new password via token | Public |
| POST   | /auth/logout | End session          | Authenticated |
| GET    | /auth/me     | Current user profile | Authenticated |
| PATCH  | /auth/me     | Update profile       | Authenticated |


### Organizations


| Method | Path               | Description      | Auth            |
| ------ | ------------------ | ---------------- | --------------- |
| GET    | /organizations     | List user's orgs | Authenticated   |
| POST   | /organizations     | Create team org  | Authenticated   |
| GET    | /organizations/:id | Org details      | Org member      |
| PATCH  | /organizations/:id | Update org       | Org owner/admin |


### Members


| Method | Path                                 | Description   | Auth            |
| ------ | ------------------------------------ | ------------- | --------------- |
| GET    | /organizations/:id/members           | List members  | Org member      |
| POST   | /organizations/:id/members           | Invite member (sends email) | Org owner/admin |
| GET    | /invites/:token                      | Get invite details | Public |
| POST   | /invites/:token/accept               | Accept invitation  | Authenticated |
| POST   | /invites/:token/decline              | Decline invitation | Authenticated |
| PATCH  | /organizations/:id/members/:memberId | Change role   | Org owner/admin |
| DELETE | /organizations/:id/members/:memberId | Remove member | Org owner       |


---

## Pages / Screens


| Route                 | Description                             | Access          |
| --------------------- | --------------------------------------- | --------------- |
| /login                | Sign in form                            | Public          |
| /signup               | Registration form                       | Public          |
| /forgot-password      | Request password reset email            | Public          |
| /reset-password       | Set new password (via email link)       | Public          |
| /profile              | Edit name, avatar, change password      | Authenticated   |
| /invite/[token]       | Accept or decline an org invitation     | Public (login required to accept) |
| /dashboard            | Main dashboard (scoped to selected org) | Authenticated   |
| /orgs                 | Organization list / switcher            | Authenticated   |
| /orgs/new             | Create new team organization            | Authenticated   |
| /orgs/[slug]/settings | Org settings + member management        | Org owner/admin |


### Navigation

- Org switcher in the sidebar/header (always visible when authenticated)
- Redirect unauthenticated users to /login
- After login, redirect to /dashboard (default org context)

---

## Access Control Matrix


| Action              | Owner | Admin | Member |
| ------------------- | ----- | ----- | ------ |
| View org data       | Yes   | Yes   | Yes    |
| Update org settings | Yes   | Yes   | No     |
| Invite members      | Yes   | Yes   | No     |
| Change member roles | Yes   | Yes   | No     |
| Remove members      | Yes   | No    | No     |
| Delete organization | Yes   | No    | No     |


---

## Acceptance Criteria

1. New user signs up → personal org auto-created, landed on dashboard
2. User logs in/out successfully
3. User creates a team org with a custom name
4. Owner invites a member by email
5. Invited member can see the shared org in their org list
6. Org switcher allows navigating between orgs
7. Member cannot access org settings
8. RLS prevents querying data from orgs the user doesn't belong to
9. Works in production (deployed to VPS via Dokploy)


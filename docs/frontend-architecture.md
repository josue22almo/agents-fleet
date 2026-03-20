# Frontend Architecture

## Principles

- **Web is API-agnostic** — knows nothing about Supabase, database, or backend implementation. Communicates only via `@repo/contracts` types and `fetch`
- **Component-driven** — UI is composed of small, reusable components
- **Server components by default** — use client components (`"use client"`) only when interactivity is needed (forms, state, effects)
- **Type safety end-to-end** — shared Zod contracts between API and Web ensure type consistency

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI components | shadcn/ui + Radix primitives |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query |
| Validation | Zod (via `@repo/contracts`) |
| Testing | Vitest |

## Folder Structure

```
apps/web/
  app/                              # Next.js App Router
    (auth)/                         # Route group: public auth pages
      login/page.tsx
      signup/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
    (dashboard)/                    # Route group: authenticated pages
      layout.tsx                    # Sidebar + org switcher layout
      dashboard/page.tsx
      orgs/page.tsx
      orgs/new/page.tsx
      orgs/[slug]/settings/page.tsx
      profile/page.tsx
      invite/[token]/page.tsx
    layout.tsx                      # Root layout (fonts, providers)
    globals.css

  components/
    ui/                             # shadcn components (button, input, card, etc.)
    layout/                         # App shell components
      sidebar.tsx
      org-switcher.tsx
      user-menu.tsx
    features/                       # Feature components grouped by user flow
      sign-in/
        sign-in-form.tsx
      sign-up/
        sign-up-form.tsx
      forgot-password/
        forgot-password-form.tsx
      create-organization/
        create-organization-form.tsx
      org-settings/
        org-settings-form.tsx
        member-list.tsx
        danger-zone.tsx
      invite-member/
        invite-member-form.tsx
      accept-invitation/
        accept-invitation-card.tsx
      edit-profile/
        edit-profile-form.tsx
        change-password-form.tsx

  hooks/                            # Custom React hooks
    use-auth.ts                     # Auth state (tokens, current user)
    use-organizations.ts            # TanStack Query hooks for orgs
    use-members.ts                  # TanStack Query hooks for members

  lib/                              # Utilities
    api-client.ts                   # Fetch wrapper with auth headers
    query-client.ts                 # TanStack Query client config
    auth.ts                         # Token storage, refresh logic

  providers/                        # React context providers
    query-provider.tsx              # TanStack QueryClientProvider
    auth-provider.tsx               # Auth context (token state, user)
```

## Route Groups

Next.js route groups `(auth)` and `(dashboard)` share different layouts without affecting the URL:

- **(auth)** — centered card layout, no sidebar. For login, signup, password reset
- **(dashboard)** — sidebar layout with org switcher, nav, and user menu. Protected by auth middleware

## API Client

A thin fetch wrapper that attaches auth tokens and uses `@repo/contracts` types. No Supabase, no direct DB access.

### Rules

- All API calls go through `lib/api-client.ts`
- Request types validated with Zod `.parse()` before sending
- Response types from `@repo/contracts` for type safety
- Automatic token refresh on 401 responses
- Never import backend packages (`@repo/contexts`, `@supabase/supabase-js`) in the web app

## Data Fetching with TanStack Query

### Rules

- One hook per API resource in `hooks/`
- Query keys follow `[resource, ...params]` pattern (e.g., `['organizations']`, `['organizations', slug, 'members']`)
- Mutations invalidate related queries on success
- Loading and error states handled consistently via shared patterns

## Auth on the Client

- **Token storage** — access token in memory, refresh token in httpOnly cookie (set by API)
- **Auth provider** — React context wrapping the app, exposes `user`, `login()`, `logout()`, `isAuthenticated`
- **Protected routes** — Next.js middleware redirects unauthenticated users to `/login`
- **Token refresh** — API client intercepts 401 responses and attempts refresh before failing

## Component Conventions

- **shadcn components** in `components/ui/` — never modify directly, use composition and className overrides
- **Layout components** in `components/layout/` — app shell, navigation, shared structure
- **Feature components** in `components/features/{flow}/` — one folder per user flow (e.g., `create-organization/`, `invite-member/`). Named as user actions, not entities
- **Pages are thin** — pages wire components and hooks together, minimal logic in page files
- **Forms use Zod** — validate with contract schemas via `safeParse()`, display errors inline

## Error Handling

Three types of errors, each handled differently.

### 1. Validation Errors (form input)

Caught **before** the API call using Zod `.safeParse()` from `@repo/contracts`. Displayed inline next to the relevant field.

```typescript
// components/features/create-organization/create-organization-form.tsx
const result = CreateOrgRequestSchema.safeParse(formData);

if (!result.success) {
  // result.error.flatten() gives { fieldErrors: { name: [...], slug: [...] } }
  setFieldErrors(result.error.flatten().fieldErrors);
  return;
}

// Only call API if validation passes
await createOrg.mutateAsync(result.data);
```

Display: red text below each invalid field. No toast, no global banner — the error is scoped to the field.

### 2. API Errors (domain errors from backend)

The API returns `{ error: { code, message } }` for all domain errors (see backend architecture). The API client parses this and throws a typed `ApiError`.

```typescript
// lib/api-client.ts
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: getHeaders() });

  if (!res.ok) {
    const body = await res.json();
    throw new ApiError(body.error.code, body.error.message, res.status);
  }

  return res.json();
}
```

How they're shown depends on context:

- **Forms** (mutations) — display the error message above the submit button or as a toast. The component catches the error from `useMutation`'s `onError`:

```typescript
const createOrg = useCreateOrg();

// In the form's onSubmit:
createOrg.mutate(data, {
  onError: (error) => {
    if (error instanceof ApiError) {
      setFormError(error.message); // "The slug 'acme' is already in use"
    }
  },
});

// In JSX:
{formError && <p className="text-sm text-destructive">{formError}</p>}
```

- **Pages** (queries) — use TanStack Query's error state to show an inline error with retry:

```typescript
const { data, error, isLoading, refetch } = useOrganizations();

if (error) {
  return <ErrorState message={error.message} onRetry={refetch} />;
}
```

### 3. Unexpected Errors (network failures, 500s)

Caught by a **global error boundary** and TanStack Query's default error handling. Shown as a full-page or toast error depending on severity.

```typescript
// app/(dashboard)/error.tsx — Next.js error boundary
'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-16">
      <h2 className="text-lg font-medium">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
      <Button onClick={reset} className="mt-4">Try again</Button>
    </div>
  );
}
```

### Error Display Components

```
components/
  ui/
    error-state.tsx          # Inline error with retry button (for query errors)
    form-error.tsx           # Error banner above form submit (for mutation errors)
    field-error.tsx          # Red text below a form field (for validation errors)
```

### Summary

| Error Type | Source | Display | Location |
|---|---|---|---|
| Validation | Zod `.safeParse()` | Inline below field | Next to the invalid field |
| API domain error | `ApiError` from response | Form-level message or toast | Above submit button |
| Unexpected / network | fetch failure, 500 | Error boundary or toast | Full page or global |

## Styling

- **Tailwind CSS** for all styling
- **shadcn theme** — use CSS variables defined by shadcn for colors, radius, etc.
- **No CSS modules** — Tailwind replaces the need for module styles
- **Light theme** with color accents (purple primary) as defined in mockups
- **Responsive** — mobile-first, sidebar collapses on small screens

## Testing

- **Vitest** as test runner (same as backend)
- **Test files** live side by side: `login-form.tsx` → `login-form.test.tsx`
- **Unit tests** for hooks and utility functions
- **Component tests** for interactive components (forms, org switcher)
- **E2E tests** in the API app cover full-stack flows

## Future Considerations

- **Internationalization (i18n)** — not needed now, but keep text in components (not hardcoded in utilities) to make extraction easier later
- **Dark mode** — CSS variables from shadcn support it, can toggle later
- **Real-time updates** — TanStack Query supports WebSocket invalidation if needed for live metrics

/**
 * Seed script — creates test data via the API and Supabase admin.
 * Idempotent: safe to run multiple times (cleans up before inserting).
 *
 * Uses Supabase admin for:
 *   - Cleanup (cascade deletes)
 *   - Auth user creation (no API endpoint for admin user creation)
 *   - Profiles (created before API is usable)
 *
 * Uses the API for:
 *   - Organizations (POST /organizations)
 *   - Agents (POST /agents)
 *   - Runs (POST /ingest)
 *   - Invitations (POST /organizations/:id/members — invite flow)
 *
 * Parallelizes independent operations with Promise.all.
 *
 * Usage: pnpm db:seed (requires API running on localhost:4000)
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_URL = process.env.API_URL ?? "http://localhost:4000";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- API helpers ---

async function apiPost<T = unknown>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`API ${path} failed (${res.status}): ${err}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function apiLogin(email: string, password: string): Promise<string> {
  const data = await apiPost<{ accessToken: string }>("/auth/login", { email, password });
  return data.accessToken;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// --- Test data ---

const TEST_USERS = [
  { email: "alice@test.com", password: "password123", fullName: "Alice Johnson" },
  { email: "bob@test.com", password: "password123", fullName: "Bob Smith" },
  { email: "carol@test.com", password: "password123", fullName: "Carol Williams" },
  { email: "dave@test.com", password: "password123", fullName: "Dave Brown" },
];

// --- Cleanup ---

async function cleanup() {
  console.log("Cleaning up existing test data...");

  const { data: list } = await supabase.auth.admin.listUsers();
  const testEmails = TEST_USERS.map((u) => u.email);
  const existingUsers = list?.users?.filter((u) => u.email && testEmails.includes(u.email)) ?? [];
  const existingIds = existingUsers.map((u) => u.id);

  if (existingIds.length > 0) {
    // Cascade: runs → agents → invitations → members → orgs → profiles → auth
    const orgIds = (
      await supabase.from("organization_members").select("organization_id").in("user_id", existingIds)
    ).data?.map((m) => m.organization_id) ?? [];

    if (orgIds.length > 0) {
      const agentIds = (await supabase.from("agents").select("id").in("organization_id", orgIds)).data?.map((a) => a.id) ?? [];
      if (agentIds.length > 0) {
        await supabase.from("runs").delete().in("agent_id", agentIds);
        await supabase.from("sessions").delete().in("agent_id", agentIds);
      }
      await supabase.from("agents").delete().in("organization_id", orgIds);
      await supabase.from("invitations").delete().in("organization_id", orgIds);
    }

    await supabase.from("organization_members").delete().in("user_id", existingIds);
    await supabase.from("organizations").delete().in("id", orgIds);
    await supabase.from("profiles").delete().in("id", existingIds);

    await Promise.all(existingUsers.map(async (user) => {
      await supabase.auth.admin.deleteUser(user.id);
      console.log(`  Deleted user ${user.email}`);
    }));
  }

  console.log("  Cleanup complete");
}

// --- Seed ---

async function seed() {
  await cleanup();

  // 1. Create auth users (parallel)
  console.log("\nCreating test users...");
  const userResults = await Promise.all(
    TEST_USERS.map(async (user) => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName },
      });
      if (error) throw new Error(`Failed to create ${user.email}: ${error.message}`);
      console.log(`  Created user ${user.email} (${data.user.id})`);
      return { email: user.email, id: data.user.id, fullName: user.fullName };
    }),
  );

  const userMap = Object.fromEntries(userResults.map((u) => [u.email, u]));
  const alice = userMap["alice@test.com"]!;
  const bob = userMap["bob@test.com"]!;

  // 2. Create profiles (parallel)
  console.log("\nCreating profiles...");
  await Promise.all(
    userResults.map(async (user) => {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: user.fullName,
      });
      if (error) console.error(`  Profile ${user.email}:`, error.message);
      else console.log(`  Created profile for ${user.email}`);
    }),
  );

  // 3. Create personal orgs (parallel)
  console.log("\nCreating personal organizations...");
  const personalOrgIds: Record<string, string> = {};
  await Promise.all(
    userResults.map(async (user) => {
      const orgId = crypto.randomUUID();
      personalOrgIds[user.email] = orgId;
      const slug = user.fullName.toLowerCase().replace(/\s+/g, "-") + "-personal-" + user.id.substring(0, 8);
      const { error: orgError } = await supabase.from("organizations").insert({
        id: orgId, name: `${user.fullName}'s Space`, slug, type: "individual",
      });
      if (orgError) { console.error(`  Personal org for ${user.email}:`, orgError.message); return; }
      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: orgId, user_id: user.id, role: "owner",
      });
      if (memberError) console.error(`  Membership for ${user.email}:`, memberError.message);
      else console.log(`  Created personal org for ${user.email}`);
    }),
  );

  // 4. Create team orgs + members (sequential — members depend on orgs)
  console.log("\nCreating team organizations...");
  const teamOrgs = [
    { name: "Acme Corp", slug: "acme-corp" },
    { name: "Startup Labs", slug: "startup-labs" },
  ];

  // Login as alice to use the API
  const aliceToken = await apiLogin(alice.email, "password123");

  const orgIds: Record<string, string> = {};
  for (const org of teamOrgs) {
    const created = await apiPost<{ id: string }>("/organizations", org, aliceToken);
    orgIds[org.slug] = created.id;
    console.log(`  Created ${org.name} (${created.id})`);
  }

  // Add members via direct insert (API invite flow sends emails)
  console.log("\nAdding members...");
  const members = [
    { organization_id: orgIds["acme-corp"]!, user_id: bob.id, role: "admin" },
    { organization_id: orgIds["acme-corp"]!, user_id: userMap["carol@test.com"]!.id, role: "member" },
    { organization_id: orgIds["startup-labs"]!, user_id: bob.id, role: "member" },
  ];
  await Promise.all(
    members.map(async (m) => {
      const { error } = await supabase.from("organization_members").insert(m);
      if (error) console.error(`  ${m.role}:`, error.message);
      else console.log(`  Added ${m.role} to org`);
    }),
  );

  // 5. Create invitations (direct insert — API would send real emails)
  console.log("\nCreating invitations...");
  await Promise.all([
    supabase.from("invitations").insert({
      organization_id: orgIds["acme-corp"]!, email: "dave@test.com", role: "member",
      token: "test-invite-token-001", invited_by: alice.id, status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).then(({ error }) => error ? console.error("  Pending invite:", error.message) : console.log("  Created pending invite for dave@test.com")),
    supabase.from("invitations").insert({
      organization_id: orgIds["acme-corp"]!, email: "expired@test.com", role: "member",
      token: "test-invite-token-expired", invited_by: alice.id, status: "pending",
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    }).then(({ error }) => error ? console.error("  Expired invite:", error.message) : console.log("  Created expired invite")),
  ]);

  // 6. Create agents via API (parallel per org)
  console.log("\nCreating agents...");
  const bobToken = await apiLogin(bob.email, "password123");

  type AgentDef = { name: string; type: string; orgId: string; token: string };
  const agentDefs: AgentDef[] = [
    // Acme Corp
    { name: "Claude Code — Production", type: "claude", orgId: orgIds["acme-corp"]!, token: aliceToken },
    { name: "Manus Research", type: "manus", orgId: orgIds["acme-corp"]!, token: aliceToken },
    { name: "Custom Script", type: "custom", orgId: orgIds["acme-corp"]!, token: bobToken },
    // Startup Labs
    { name: "Claude Code — Staging", type: "claude", orgId: orgIds["startup-labs"]!, token: aliceToken },
    { name: "Manus Explorer", type: "manus", orgId: orgIds["startup-labs"]!, token: aliceToken },
    // Personal orgs
    { name: "Alice's Claude", type: "claude", orgId: personalOrgIds["alice@test.com"]!, token: aliceToken },
    { name: "Bob's Custom Agent", type: "custom", orgId: personalOrgIds["bob@test.com"]!, token: bobToken },
  ];

  const createdAgents = await Promise.all(
    agentDefs.map(async (def) => {
      try {
        const agent = await apiPost<{ id: string; connectionToken: string }>(
          "/agents",
          { name: def.name, type: def.type, organizationId: def.orgId },
          def.token,
        );
        console.log(`  Created agent "${def.name}"`);
        return { id: agent.id, name: def.name, connectionToken: agent.connectionToken };
      } catch (e) {
        console.error(`  Agent "${def.name}":`, (e as Error).message);
        return null;
      }
    }),
  );

  // 7. Ingest runs via API (parallel per agent), grouped into sessions
  console.log("\nCreating sessions and runs via ingest API...");
  const activeAgents = createdAgents.filter((a): a is NonNullable<typeof a> => a !== null);

  const sessionNames = [
    "Code Review PR #42",
    "Bug Fix: Auth Timeout",
    "Research: API Design",
    "Refactor: Database Queries",
    "Feature: User Notifications",
    "Test: Integration Suite",
  ];

  await Promise.all(
    activeAgents.map(async (agent) => {
      const sessionCount = randomInt(1, 2);
      let totalRuns = 0;

      for (let s = 0; s < sessionCount; s++) {
        const sessionName = sessionNames[randomInt(0, sessionNames.length - 1)]!;
        let sessionId: string | undefined;

        try {
          // Start session
          const sessionResult = await apiPost<{ id: string }>("/ingest", {
            event: "session.started",
            timestamp: new Date().toISOString(),
            data: { name: `${sessionName} (${agent.name.substring(0, 10)})` },
          }, agent.connectionToken);
          sessionId = sessionResult.id;
          console.log(`  Started session "${sessionName}" for "${agent.name}"`);
        } catch (e) {
          console.error(`  Session start for "${agent.name}":`, (e as Error).message);
          continue;
        }

        // Create runs within the session
        const runCount = randomInt(2, 5);
        let allCompleted = true;

        for (let i = 0; i < runCount; i++) {
          const runId = `seed_${agent.id.substring(0, 8)}_s${s}_${i.toString().padStart(3, "0")}`;
          const statusRoll = Math.random();

          try {
            // Start run with sessionId
            await apiPost("/ingest", {
              event: "run.started",
              runId,
              sessionId,
              data: { metadata: { source: "seed", session: s, index: i } },
            }, agent.connectionToken);

            // Add tool calls for this run
            const toolNames = ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent", "WebFetch"];
            const toolCount = randomInt(2, 6);
            for (let t = 0; t < toolCount; t++) {
              try {
                await apiPost("/ingest", {
                  event: "tool.called",
                  runId,
                  data: {
                    toolName: toolNames[randomInt(0, toolNames.length - 1)],
                    durationMs: randomInt(50, 3000),
                    success: Math.random() > 0.1,
                  },
                }, agent.connectionToken);
              } catch { /* ignore tool call failures */ }
            }

            if (statusRoll < 0.6) {
              // Complete
              await apiPost("/ingest", {
                event: "run.completed",
                runId,
                data: {
                  durationMs: randomInt(500, 5000),
                  tokensUsed: randomInt(100, 2000),
                  cost: randomFloat(0.01, 0.5, 4),
                },
              }, agent.connectionToken);
            } else if (statusRoll < 0.85) {
              // Fail
              allCompleted = false;
              await apiPost("/ingest", {
                event: "run.failed",
                runId,
                data: {
                  durationMs: randomInt(200, 3000),
                  error: ["Connection timeout", "Rate limit exceeded", "Model overloaded", "Context window exceeded"][randomInt(0, 3)],
                },
              }, agent.connectionToken);
            }
            // else: leave as running

            totalRuns++;
          } catch (e) {
            console.error(`  Run ${runId}:`, (e as Error).message);
          }
        }

        // Complete the session
        try {
          await apiPost("/ingest", {
            event: allCompleted ? "session.completed" : "session.completed",
            sessionId,
            timestamp: new Date().toISOString(),
          }, agent.connectionToken);
        } catch (e) {
          console.error(`  Session complete for "${agent.name}":`, (e as Error).message);
        }
      }

      // Also create a few standalone runs (without sessions) for variety
      const standaloneCount = randomInt(2, 4);
      for (let i = 0; i < standaloneCount; i++) {
        const runId = `seed_${agent.id.substring(0, 8)}_solo_${i.toString().padStart(3, "0")}`;
        const statusRoll = Math.random();

        try {
          await apiPost("/ingest", {
            event: "run.started",
            runId,
            data: { metadata: { source: "seed", standalone: true, index: i } },
          }, agent.connectionToken);

          // Add tool calls for standalone runs
          const toolNames = ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent", "WebFetch"];
          const toolCount = randomInt(1, 4);
          for (let t = 0; t < toolCount; t++) {
            try {
              await apiPost("/ingest", {
                event: "tool.called",
                runId,
                data: {
                  toolName: toolNames[randomInt(0, toolNames.length - 1)],
                  durationMs: randomInt(50, 3000),
                  success: Math.random() > 0.1,
                },
              }, agent.connectionToken);
            } catch { /* ignore tool call failures */ }
          }

          if (statusRoll < 0.6) {
            await apiPost("/ingest", {
              event: "run.completed",
              runId,
              data: {
                durationMs: randomInt(500, 5000),
                tokensUsed: randomInt(100, 2000),
                cost: randomFloat(0.01, 0.5, 4),
              },
            }, agent.connectionToken);
          } else if (statusRoll < 0.85) {
            await apiPost("/ingest", {
              event: "run.failed",
              runId,
              data: {
                durationMs: randomInt(200, 3000),
                error: ["Connection timeout", "Rate limit exceeded", "Model overloaded", "Context window exceeded"][randomInt(0, 3)],
              },
            }, agent.connectionToken);
          }

          totalRuns++;
        } catch (e) {
          console.error(`  Run ${runId}:`, (e as Error).message);
        }
      }

      console.log(`  Created ${totalRuns} runs across ${sessionCount} sessions for "${agent.name}"`);
    }),
  );

  console.log("\nSeed complete!");
  console.log("\nTest credentials:");
  console.log("  alice@test.com / password123  — owner of Acme Corp & Startup Labs");
  console.log("  bob@test.com   / password123  — admin of Acme Corp, member of Startup Labs");
  console.log("  carol@test.com / password123  — member of Acme Corp");
  console.log("  dave@test.com  / password123  — pending invite to Acme Corp");
}

seed().catch(console.error);

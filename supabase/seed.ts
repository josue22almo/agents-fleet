/**
 * Seed script — creates test data in Supabase.
 * Idempotent: safe to run multiple times (cleans up before inserting).
 *
 * Order:
 *   1. Cleanup (runs → agents → invitations → members → orgs → profiles → auth users)
 *   2. Users (alice, bob, carol, dave — password: password123)
 *   3. Profiles
 *   4. Personal orgs (one per user with owner membership)
 *   5. Team orgs (Acme Corp + Startup Labs with role-based memberships)
 *   6. Invitations (pending + expired)
 *   7. Agents (3 for Acme Corp, 2 for Startup Labs, 1 per personal org — with connection tokens)
 *   8. Runs (5-10 per active agent — 60% completed, 25% failed, 15% running)
 *
 * Usage: pnpm db:seed
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  { email: "alice@test.com", password: "password123", fullName: "Alice Johnson" },
  { email: "bob@test.com", password: "password123", fullName: "Bob Smith" },
  { email: "carol@test.com", password: "password123", fullName: "Carol Williams" },
  { email: "dave@test.com", password: "password123", fullName: "Dave Brown" },
];

const ACME_ORG_ID = "a0000000-0000-0000-0000-000000000001";
const STARTUP_ORG_ID = "a0000000-0000-0000-0000-000000000002";

const AGENT_IDS = {
  // Acme Corp agents
  claudeCode: "b0000000-0000-0000-0000-000000000001",
  manusResearch: "b0000000-0000-0000-0000-000000000002",
  customScript: "b0000000-0000-0000-0000-000000000003",
  // Startup Labs agents
  startupClaude: "b0000000-0000-0000-0000-000000000004",
  startupManus: "b0000000-0000-0000-0000-000000000005",
};

function generateConnectionToken(): { raw: string; hash: string; prefix: string } {
  const raw = "af_" + randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  const prefix = raw.substring(0, 11);
  return { raw, hash, prefix };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function cleanup() {
  console.log("Cleaning up existing test data...");

  // Delete in order: invitations → members → orgs → profiles → auth users
  const { data: list } = await supabase.auth.admin.listUsers();
  const testEmails = TEST_USERS.map((u) => u.email);
  const existingUsers = list?.users?.filter((u) => u.email && testEmails.includes(u.email)) ?? [];
  const existingIds = existingUsers.map((u) => u.id);

  if (existingIds.length > 0) {
    await supabase.from("invitations").delete().in("invited_by", existingIds);
    await supabase.from("invitations").delete().in("email", testEmails);
    await supabase.from("organization_members").delete().in("user_id", existingIds);
    await supabase.from("organizations").delete().in("id", [ACME_ORG_ID, STARTUP_ORG_ID]);
    // Also delete personal orgs created by event handlers
    await supabase.from("organizations").delete().in(
      "id",
      (await supabase.from("organizations").select("id").in(
        "id",
        (await supabase.from("organization_members").select("organization_id").in("user_id", existingIds)).data?.map(
          (m) => m.organization_id,
        ) ?? [],
      )).data?.map((o) => o.id) ?? [],
    );
    await supabase.from("profiles").delete().in("id", existingIds);

    for (const user of existingUsers) {
      await supabase.auth.admin.deleteUser(user.id);
      console.log(`  Deleted user ${user.email}`);
    }
  }

  // Clean up agents and runs for known agent IDs
  const agentIds = Object.values(AGENT_IDS);
  await supabase.from("runs").delete().in("agent_id", agentIds);
  await supabase.from("agents").delete().in("id", agentIds);
  // Also clean up any agents belonging to known orgs
  await supabase.from("agents").delete().in("organization_id", [ACME_ORG_ID, STARTUP_ORG_ID]);

  // Clean up orgs by known IDs (in case users were already deleted)
  await supabase.from("organization_members").delete().in("organization_id", [ACME_ORG_ID, STARTUP_ORG_ID]);
  await supabase.from("invitations").delete().in("organization_id", [ACME_ORG_ID, STARTUP_ORG_ID]);
  await supabase.from("organizations").delete().in("id", [ACME_ORG_ID, STARTUP_ORG_ID]);

  console.log("  Cleanup complete");
}

async function createUser(email: string, password: string, fullName: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    throw new Error(`Failed to create ${email}: ${error.message}`);
  }

  console.log(`  Created user ${email} (${data.user.id})`);
  return data.user.id;
}

async function seed() {
  await cleanup();

  console.log("\nCreating test users...");
  const userIds: Record<string, string> = {};

  for (const user of TEST_USERS) {
    userIds[user.email] = await createUser(user.email, user.password, user.fullName);
  }

  console.log("\nCreating profiles...");
  for (const user of TEST_USERS) {
    const { error } = await supabase.from("profiles").upsert({
      id: userIds[user.email],
      email: user.email,
      full_name: user.fullName,
    });
    if (error) console.error(`  Profile ${user.email}:`, error.message);
    else console.log(`  Created profile for ${user.email}`);
  }

  const alice = userIds["alice@test.com"]!;
  const bob = userIds["bob@test.com"]!;
  const carol = userIds["carol@test.com"]!;

  // Create personal organizations for each user
  console.log("\nCreating personal organizations...");
  const personalOrgIds: Record<string, string> = {};
  for (const user of TEST_USERS) {
    const userId = userIds[user.email]!;
    const personalOrgId = crypto.randomUUID();
    personalOrgIds[user.email] = personalOrgId;
    const slug = user.fullName.toLowerCase().replace(/\s+/g, "-") + "-personal-" + userId.substring(0, 8);

    const { error: orgError } = await supabase.from("organizations").insert({
      id: personalOrgId,
      name: `${user.fullName}'s Space`,
      slug,
      type: "individual",
    });
    if (orgError) {
      console.error(`  Personal org for ${user.email}:`, orgError.message);
      continue;
    }

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: personalOrgId,
      user_id: userId,
      role: "owner",
    });
    if (memberError) console.error(`  Personal org membership for ${user.email}:`, memberError.message);
    else console.log(`  Created personal org for ${user.email}`);
  }

  console.log("\nCreating team organizations...");

  const { error: acmeError } = await supabase.from("organizations").insert({
    id: ACME_ORG_ID,
    name: "Acme Corp",
    slug: "acme-corp",
    type: "team",
  });
  if (acmeError) console.error("  Acme Corp:", acmeError.message);
  else console.log("  Created Acme Corp");

  const { error: startupError } = await supabase.from("organizations").insert({
    id: STARTUP_ORG_ID,
    name: "Startup Labs",
    slug: "startup-labs",
    type: "team",
  });
  if (startupError) console.error("  Startup Labs:", startupError.message);
  else console.log("  Created Startup Labs");

  console.log("\nAdding members...");

  const members = [
    { organization_id: ACME_ORG_ID, user_id: alice, role: "owner" },
    { organization_id: ACME_ORG_ID, user_id: bob, role: "admin" },
    { organization_id: ACME_ORG_ID, user_id: carol, role: "member" },
    { organization_id: STARTUP_ORG_ID, user_id: alice, role: "owner" },
    { organization_id: STARTUP_ORG_ID, user_id: bob, role: "member" },
  ];

  for (const member of members) {
    const { error } = await supabase.from("organization_members").insert(member);
    if (error) console.error(`  ${member.role} membership:`, error.message);
    else console.log(`  Added ${member.role} to org`);
  }

  console.log("\nCreating invitations...");

  const { error: inviteError } = await supabase.from("invitations").insert({
    organization_id: ACME_ORG_ID,
    email: "dave@test.com",
    role: "member",
    token: "test-invite-token-001",
    invited_by: alice,
    status: "pending",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (inviteError) console.error("  Pending invite:", inviteError.message);
  else console.log("  Created pending invite for dave@test.com");

  const { error: expiredError } = await supabase.from("invitations").insert({
    organization_id: ACME_ORG_ID,
    email: "expired@test.com",
    role: "member",
    token: "test-invite-token-expired",
    invited_by: alice,
    status: "pending",
    expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  });
  if (expiredError) console.error("  Expired invite:", expiredError.message);
  else console.log("  Created expired invite");

  // --- Agents ---
  console.log("\nCreating agents...");

  const agentDefinitions = [
    // Acme Corp agents
    {
      id: AGENT_IDS.claudeCode,
      organization_id: ACME_ORG_ID,
      name: "Claude Code — Production",
      type: "claude",
      status: "active",
      created_by: alice,
      last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: AGENT_IDS.manusResearch,
      organization_id: ACME_ORG_ID,
      name: "Manus Research",
      type: "manus",
      status: "active",
      created_by: alice,
      last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: AGENT_IDS.customScript,
      organization_id: ACME_ORG_ID,
      name: "Custom Script",
      type: "custom",
      status: "inactive",
      created_by: bob,
      last_seen_at: null,
    },
    // Startup Labs agents
    {
      id: AGENT_IDS.startupClaude,
      organization_id: STARTUP_ORG_ID,
      name: "Claude Code — Staging",
      type: "claude",
      status: "active",
      created_by: alice,
      last_seen_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: AGENT_IDS.startupManus,
      organization_id: STARTUP_ORG_ID,
      name: "Manus Explorer",
      type: "manus",
      status: "active",
      created_by: alice,
      last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    // Personal org agents
    {
      id: crypto.randomUUID(),
      organization_id: personalOrgIds["alice@test.com"]!,
      name: "Alice's Claude",
      type: "claude",
      status: "active",
      created_by: alice,
      last_seen_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      organization_id: personalOrgIds["bob@test.com"]!,
      name: "Bob's Custom Agent",
      type: "custom",
      status: "active",
      created_by: bob,
      last_seen_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ];

  const activeAgentsList: { id: string; name: string }[] = [];
  for (const agentDef of agentDefinitions) {
    const token = generateConnectionToken();
    const { error } = await supabase.from("agents").insert({
      ...agentDef,
      token_hash: token.hash,
      token_prefix: token.prefix,
    });
    if (error) console.error(`  Agent "${agentDef.name}":`, error.message);
    else {
      console.log(`  Created agent "${agentDef.name}" (${agentDef.status})`);
      if (agentDef.status === "active") {
        activeAgentsList.push({ id: agentDef.id, name: agentDef.name });
      }
    }
  }

  // --- Runs ---
  console.log("\nCreating runs for active agents...");

  const activeAgents = activeAgentsList;

  for (const agent of activeAgents) {
    const runCount = randomInt(5, 10);
    const runs: Record<string, unknown>[] = [];

    for (let i = 0; i < runCount; i++) {
      const statusRoll = Math.random();
      let status: string;
      let completedAt: string | null = null;
      let durationMs: number | null = null;
      let tokensUsed: number | null = null;
      let cost: number | null = null;
      let error: string | null = null;

      const startedAt = new Date(
        Date.now() - randomInt(1, 72) * 60 * 60 * 1000 - randomInt(0, 3600) * 1000,
      ).toISOString();

      if (statusRoll < 0.6) {
        // 60% completed
        status = "completed";
        durationMs = randomInt(500, 5000);
        tokensUsed = randomInt(100, 2000);
        cost = randomFloat(0.01, 0.5, 4);
        completedAt = new Date(new Date(startedAt).getTime() + durationMs).toISOString();
      } else if (statusRoll < 0.85) {
        // 25% failed
        status = "failed";
        durationMs = randomInt(200, 3000);
        error = [
          "Connection timeout after 30s",
          "Rate limit exceeded",
          "Invalid API key",
          "Model overloaded, try again later",
          "Context window exceeded",
        ][randomInt(0, 4)]!;
        completedAt = new Date(new Date(startedAt).getTime() + durationMs).toISOString();
      } else {
        // 15% running
        status = "running";
        // Running runs started recently, no completedAt
      }

      runs.push({
        agent_id: agent.id,
        external_run_id: `run_${agent.id.substring(0, 8)}_${i.toString().padStart(3, "0")}`,
        status,
        started_at: status === "running" ? new Date(Date.now() - randomInt(10, 300) * 1000).toISOString() : startedAt,
        completed_at: completedAt,
        duration_ms: durationMs,
        tokens_used: tokensUsed,
        cost,
        error,
        metadata: { source: "seed" },
      });
    }

    const { error: runsError } = await supabase.from("runs").insert(runs);
    if (runsError) console.error(`  Runs for "${agent.name}":`, runsError.message);
    else console.log(`  Created ${runs.length} runs for "${agent.name}"`);
  }

  console.log("\nSeed complete!");
  console.log("\nTest credentials:");
  console.log("  alice@test.com / password123  — owner of Acme Corp & Startup Labs");
  console.log("  bob@test.com   / password123  — admin of Acme Corp, member of Startup Labs");
  console.log("  carol@test.com / password123  — member of Acme Corp");
  console.log("  dave@test.com  / password123  — pending invite to Acme Corp");
}

seed().catch(console.error);

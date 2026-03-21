import { createClient } from "@supabase/supabase-js";

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
  for (const user of TEST_USERS) {
    const userId = userIds[user.email]!;
    const personalOrgId = crypto.randomUUID();
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

  console.log("\nSeed complete!");
  console.log("\nTest credentials:");
  console.log("  alice@test.com / password123  — owner of Acme Corp & Startup Labs");
  console.log("  bob@test.com   / password123  — admin of Acme Corp, member of Startup Labs");
  console.log("  carol@test.com / password123  — member of Acme Corp");
  console.log("  dave@test.com  / password123  — pending invite to Acme Corp");
}

seed().catch(console.error);

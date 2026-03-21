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

async function createUser(email: string, password: string, fullName: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (existing) {
        console.log(`  User ${email} already exists (${existing.id})`);
        return existing.id;
      }
    }
    throw new Error(`Failed to create ${email}: ${error.message}`);
  }

  console.log(`  Created user ${email} (${data.user.id})`);
  return data.user.id;
}

async function seed() {
  console.log("Creating test users...");
  const userIds: Record<string, string> = {};

  for (const user of TEST_USERS) {
    userIds[user.email] = await createUser(user.email, user.password, user.fullName);
  }

  const alice = userIds["alice@test.com"]!;
  const bob = userIds["bob@test.com"]!;
  const carol = userIds["carol@test.com"]!;

  // Create team org: Acme Corp
  console.log("\nCreating team organizations...");

  const { error: acmeError } = await supabase.from("organizations").upsert({
    id: ACME_ORG_ID,
    name: "Acme Corp",
    slug: "acme-corp",
    type: "team",
  });
  if (acmeError) console.error("  Acme Corp:", acmeError.message);
  else console.log("  Created Acme Corp");

  const { error: startupError } = await supabase.from("organizations").upsert({
    id: STARTUP_ORG_ID,
    name: "Startup Labs",
    slug: "startup-labs",
    type: "team",
  });
  if (startupError) console.error("  Startup Labs:", startupError.message);
  else console.log("  Created Startup Labs");

  // Add members
  console.log("\nAdding members...");

  const members = [
    { organization_id: ACME_ORG_ID, user_id: alice, role: "owner" },
    { organization_id: ACME_ORG_ID, user_id: bob, role: "admin" },
    { organization_id: ACME_ORG_ID, user_id: carol, role: "member" },
    { organization_id: STARTUP_ORG_ID, user_id: alice, role: "owner" },
    { organization_id: STARTUP_ORG_ID, user_id: bob, role: "member" },
  ];

  for (const member of members) {
    const { error } = await supabase
      .from("organization_members")
      .upsert(member, { onConflict: "organization_id,user_id" });
    if (error) console.error(`  ${member.role} membership:`, error.message);
    else console.log(`  Added ${member.role} to org`);
  }

  // Create pending invitation for Dave
  console.log("\nCreating invitations...");

  const { error: inviteError } = await supabase.from("invitations").upsert(
    {
      organization_id: ACME_ORG_ID,
      email: "dave@test.com",
      role: "member",
      token: "test-invite-token-001",
      invited_by: alice,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "token" },
  );
  if (inviteError) console.error("  Pending invite:", inviteError.message);
  else console.log("  Created pending invite for dave@test.com");

  // Expired invitation
  const { error: expiredError } = await supabase.from("invitations").upsert(
    {
      organization_id: ACME_ORG_ID,
      email: "expired@test.com",
      role: "member",
      token: "test-invite-token-expired",
      invited_by: alice,
      status: "pending",
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: "token" },
  );
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

/**
 * Apply the "add_dynamic_roles" migration to Neon DB via WebSocket pool.
 *
 * Why this exists: local TCP to Neon is blocked by network/firewall, so the
 * Prisma schema engine (which speaks raw Postgres) can't connect. The
 * @neondatabase/serverless WebSocket Pool tunnels DDL through WebSockets and
 * commits reliably.
 *
 * Idempotent: every statement uses IF NOT EXISTS / IF EXISTS / ON CONFLICT,
 * so re-running this is safe.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

neonConfig.webSocketConstructor = ws;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const pool = new Pool({ connectionString });

const statements = [
  // ── ScreenPermission — add category column for UI grouping ──────────────────
  `ALTER TABLE "ScreenPermission" ADD COLUMN IF NOT EXISTS "category" TEXT`,

  // ── Role table ──────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "Role" (
    "id"          TEXT PRIMARY KEY,
    "name"        TEXT    NOT NULL,
    "description" TEXT,
    "scope"       TEXT    NOT NULL,
    "isSystem"    BOOLEAN NOT NULL DEFAULT false,
    "tenantId"    TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Role_tenantId_name_key" ON "Role"("tenantId", "name")`,
  `CREATE INDEX IF NOT EXISTS "Role_scope_idx" ON "Role"("scope")`,
  `CREATE INDEX IF NOT EXISTS "Role_tenantId_idx" ON "Role"("tenantId")`,

  // FK Role.tenantId → Tenant.id  (ON DELETE CASCADE so deleting a tenant kills its custom roles)
  `DO $$ BEGIN
     ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey"
       FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
       ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ── RolePermission join table ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id"           TEXT PRIMARY KEY,
    "roleId"       TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key"
     ON "RolePermission"("roleId", "permissionId")`,

  `DO $$ BEGIN
     ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
       FOREIGN KEY ("roleId") REFERENCES "Role"("id")
       ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN
     ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
       FOREIGN KEY ("permissionId") REFERENCES "ScreenPermission"("id")
       ON DELETE CASCADE ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ── User.roleId  (nullable FK, no default ⇒ existing users get NULL) ───────
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT`,

  `DO $$ BEGIN
     ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey"
       FOREIGN KEY ("roleId") REFERENCES "Role"("id")
       ON DELETE SET NULL ON UPDATE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

console.log(`Applying ${statements.length} DDL statements to Neon DB...`);

let success = 0;
for (const [i, sql] of statements.entries()) {
  const label = sql.replace(/\s+/g, ' ').slice(0, 80);
  try {
    await pool.query(sql);
    console.log(`  ✓ [${i + 1}/${statements.length}] ${label}…`);
    success++;
  } catch (err) {
    console.error(`  ✗ [${i + 1}/${statements.length}] ${label}…`);
    console.error(`    ${err.message}`);
    await pool.end();
    process.exit(1);
  }
}

await pool.end();
console.log(`\nDone — ${success}/${statements.length} statements committed.`);

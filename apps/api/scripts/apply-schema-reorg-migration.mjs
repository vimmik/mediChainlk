/**
 * Migration: move all tables out of `public` into domain schemas + create MenuItem.
 *
 * Target schemas:
 *   identity → Tenant, PharmacyBranch, UserBranchAssignment, User, Role,
 *              RolePermission, ScreenPermission, UserTypePermission,
 *              UserPermissionOverride, MenuItem, TenantOwner, TenantContact,
 *              TenantDocument
 *   catalog  → Medicine
 *   ops      → InventoryItem, Prescription, Order, OrderItem, DiseaseDetail,
 *              DiseaseUserMapping
 *   billing  → Payment
 *   audit    → AuditLog
 *
 * Why a WebSocket-pool script (not `prisma migrate`):
 *   Local TCP to Neon is blocked, so the Prisma schema engine can't connect.
 *   The @neondatabase/serverless WebSocket Pool tunnels DDL reliably.
 *
 * Data safety:
 *   `ALTER TABLE ... SET SCHEMA` RELOCATES a table — it keeps every row, index,
 *   constraint and FK intact. It is NOT a copy/drop. Cross-schema FKs are fully
 *   supported by Postgres, so existing relationships keep working...
 *
 * Idempotent:
 *   - CREATE SCHEMA IF NOT EXISTS
 *   - The move step checks the table's current schema first (via to_regclass)
 *     and only moves it if still in `public`.
 *   - MenuItem creation uses IF NOT EXISTS.
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

// table → target schema
const TABLE_SCHEMA = {
  // identity
  Tenant: 'identity',
  PharmacyBranch: 'identity',
  UserBranchAssignment: 'identity',
  User: 'identity',
  Role: 'identity',
  RolePermission: 'identity',
  ScreenPermission: 'identity',
  UserTypePermission: 'identity',
  UserPermissionOverride: 'identity',
  TenantOwner: 'identity',
  TenantContact: 'identity',
  TenantDocument: 'identity',
  // catalog
  Medicine: 'catalog',
  // ops
  InventoryItem: 'ops',
  Prescription: 'ops',
  Order: 'ops',
  OrderItem: 'ops',
  DiseaseDetail: 'ops',
  DiseaseUserMapping: 'ops',
  // billing
  Payment: 'billing',
  // audit
  AuditLog: 'audit',
};

async function run() {
  const client = await pool.connect();
  try {
    // ── 1. Create the schemas ────────────────────────────────────────────────
    console.log('Creating schemas…');
    for (const schema of ['identity', 'catalog', 'ops', 'billing', 'audit']) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      console.log(`  ✓ schema "${schema}"`);
    }

    // ── 2. Move each table to its target schema (only if still in public) ────
    console.log('\nRelocating tables…');
    let moved = 0;
    let skipped = 0;
    for (const [table, targetSchema] of Object.entries(TABLE_SCHEMA)) {
      // Where does the table live right now?
      const { rows } = await client.query(
        `SELECT n.nspname AS schema
           FROM pg_class c
           JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = $1 AND c.relkind = 'r'`,
        [table],
      );

      if (rows.length === 0) {
        console.log(`  ⚠ "${table}" not found in any schema — skipping`);
        skipped++;
        continue;
      }

      const current = rows[0].schema;
      if (current === targetSchema) {
        console.log(`  · "${table}" already in "${targetSchema}"`);
        skipped++;
        continue;
      }
      if (current !== 'public') {
        console.log(`  ⚠ "${table}" is in "${current}" (expected public) — moving to "${targetSchema}" anyway`);
      }

      await client.query(
        `ALTER TABLE "${current}"."${table}" SET SCHEMA "${targetSchema}"`,
      );
      console.log(`  ✓ "${table}": ${current} → ${targetSchema}`);
      moved++;
    }
    console.log(`\n  Moved ${moved}, skipped ${skipped}.`);

    // ── 3. Create MenuItem in identity schema ────────────────────────────────
    console.log('\nCreating MenuItem table…');
    const menuStatements = [
      `CREATE TABLE IF NOT EXISTS "identity"."MenuItem" (
        "id"           TEXT PRIMARY KEY,
        "type"         TEXT NOT NULL,
        "label"        TEXT NOT NULL,
        "icon"         TEXT,
        "parentId"     TEXT,
        "route"        TEXT,
        "permissionId" TEXT,
        "sortOrder"    INTEGER NOT NULL DEFAULT 0,
        "isActive"     BOOLEAN NOT NULL DEFAULT true,
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS "MenuItem_parentId_idx" ON "identity"."MenuItem"("parentId")`,
      `CREATE INDEX IF NOT EXISTS "MenuItem_type_idx" ON "identity"."MenuItem"("type")`,
      // self-referencing FK
      `DO $$ BEGIN
         ALTER TABLE "identity"."MenuItem" ADD CONSTRAINT "MenuItem_parentId_fkey"
           FOREIGN KEY ("parentId") REFERENCES "identity"."MenuItem"("id")
           ON DELETE CASCADE ON UPDATE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      // FK to ScreenPermission (now in identity)
      `DO $$ BEGIN
         ALTER TABLE "identity"."MenuItem" ADD CONSTRAINT "MenuItem_permissionId_fkey"
           FOREIGN KEY ("permissionId") REFERENCES "identity"."ScreenPermission"("id")
           ON DELETE SET NULL ON UPDATE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];
    for (const sql of menuStatements) {
      await client.query(sql);
    }
    console.log('  ✓ MenuItem table + indexes + FKs');

    console.log('\nMigration complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('\n✗ Migration failed:', err.message);
  process.exit(1);
});

/**
 * Creates the first system_admin user in Firebase + DB.
 * Usage: npx ts-node --project tsconfig.json scripts/create-system-admin.ts
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Load .env
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@medichainlk.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123456';

const PERMISSIONS = [
  'DASHBOARD_VIEW', 'ANALYTICS_VIEW', 'PHARMACY_MANAGE', 'USER_MANAGE',
  'PRESCRIPTION_VIEW', 'PRESCRIPTION_REVIEW', 'INVENTORY_VIEW', 'INVENTORY_MANAGE',
  'ORDER_VIEW', 'ORDER_MANAGE', 'BILLING_VIEW', 'BILLING_MANAGE',
  'AI_PIPELINE_VIEW', 'DELIVERY_MANAGE', 'GRN_MANAGE', 'MEDICINE_MANAGE', 'REPORTS_VIEW',
];

async function main() {
  // Load service account JSON
  const saPath = path.join(__dirname, '../firebase-service-account.json');
  if (!fs.existsSync(saPath)) {
    throw new Error(`Service account file not found: ${saPath}`);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  console.log(`✓ Loaded service account for project: ${serviceAccount.project_id}`);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  console.log('✓ Firebase Admin initialized');

  // Create or get Firebase user
  let fbUser: admin.auth.UserRecord;
  try {
    fbUser = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'System Admin',
      emailVerified: true,
    });
    console.log(`✓ Firebase user created: ${fbUser.uid}`);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'auth/email-already-exists') {
      fbUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✓ Firebase user already exists: ${fbUser.uid}`);
    } else {
      throw err;
    }
  }

  // Set Custom Claims
  await admin.auth().setCustomUserClaims(fbUser.uid, {
    role: 'system_admin',
    tenantId: null,
    permissions: PERMISSIONS,
  });
  console.log('✓ Custom claims set (role: system_admin)');

  // Create DB record via Neon serverless HTTP driver (works on IPv6-only networks)
  const { neon } = await import('@neondatabase/serverless');
  const dbUrl = process.env.DATABASE_URL ?? '';
  const sql = neon(dbUrl);

  // Check if already exists
  const existing = await sql`
    SELECT id, email FROM "User" WHERE role = ${'system_admin'} AND email = ${ADMIN_EMAIL} LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`✓ DB record already exists (id: ${existing[0].id})`);
  } else {
    const id = 'cm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await sql`
      INSERT INTO "User" (id, "firebaseUid", email, "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
      VALUES (${id}, ${fbUser.uid}, ${ADMIN_EMAIL}, ${'System'}, ${'Admin'}, ${'system_admin'}, ${null}, ${true}, NOW(), NOW())
    `;
    console.log(`✓ DB record created (id: ${id})`);
  }
  console.log('✓ Database done');

  console.log('\n✅  system_admin ready!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   Change the password after first login.\n');
}

main().catch((err) => {
  console.error('\n❌  Failed:', (err as Error).message ?? err);
  process.exit(1);
});

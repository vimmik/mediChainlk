import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { permissionCode: 'DASHBOARD_VIEW',      screenName: 'Dashboard',             description: 'View the main dashboard' },
  { permissionCode: 'ANALYTICS_VIEW',      screenName: 'Analytics',             description: 'View analytics and reports' },
  { permissionCode: 'PHARMACY_MANAGE',     screenName: 'Pharmacy Management',   description: 'Create and manage pharmacy tenants' },
  { permissionCode: 'USER_MANAGE',         screenName: 'User Management',       description: 'Invite, edit, and deactivate users' },
  { permissionCode: 'PRESCRIPTION_VIEW',   screenName: 'View Prescriptions',    description: 'View prescription records' },
  { permissionCode: 'PRESCRIPTION_REVIEW', screenName: 'Review Prescriptions',  description: 'Approve or reject prescriptions' },
  { permissionCode: 'INVENTORY_VIEW',      screenName: 'View Inventory',        description: 'View current stock levels' },
  { permissionCode: 'INVENTORY_MANAGE',    screenName: 'Manage Inventory',      description: 'Adjust stock levels and reorder points' },
  { permissionCode: 'ORDER_VIEW',          screenName: 'View Orders',           description: 'View customer orders' },
  { permissionCode: 'ORDER_MANAGE',        screenName: 'Manage Orders',         description: 'Process and update order status' },
  { permissionCode: 'BILLING_VIEW',        screenName: 'View Billing',          description: 'View invoices and billing records' },
  { permissionCode: 'BILLING_MANAGE',      screenName: 'Manage Billing',        description: 'Create invoices and manage payments' },
  { permissionCode: 'AI_PIPELINE_VIEW',    screenName: 'AI Pipeline',           description: 'View AI prescription processing pipeline' },
  { permissionCode: 'DELIVERY_MANAGE',     screenName: 'Manage Delivery',       description: 'Manage delivery providers and dispatch' },
  { permissionCode: 'GRN_MANAGE',          screenName: 'GRN Management',        description: 'Create and approve goods received notes' },
  { permissionCode: 'MEDICINE_MANAGE',     screenName: 'Medicine Management',   description: 'Manage medicine formulary' },
  { permissionCode: 'REPORTS_VIEW',        screenName: 'Reports',               description: 'View and export reports' },
];

// Default permissions per role
const ROLE_DEFAULTS: Record<string, string[]> = {
  system_admin: PERMISSIONS.map(p => p.permissionCode), // all
  pharmacy_admin: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'USER_MANAGE',
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_REVIEW',
    'INVENTORY_VIEW',
    'INVENTORY_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
    'AI_PIPELINE_VIEW',
    'DELIVERY_MANAGE',
    'GRN_MANAGE',
    'MEDICINE_MANAGE',
    'REPORTS_VIEW',
  ],
  pharmacy_staff: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'PRESCRIPTION_VIEW',
    'PRESCRIPTION_REVIEW',
    'INVENTORY_VIEW',
    'INVENTORY_MANAGE',
    'ORDER_VIEW',
    'ORDER_MANAGE',
    'BILLING_VIEW',
    'BILLING_MANAGE',
    'AI_PIPELINE_VIEW',
    'DELIVERY_MANAGE',
    'GRN_MANAGE',
    'MEDICINE_MANAGE',
  ],
  customer: [
    'DASHBOARD_VIEW',
    'ORDER_VIEW',
    'PRESCRIPTION_VIEW',
  ],
};

async function main() {
  console.log('Seeding ScreenPermission records...');

  // Upsert all permissions
  for (const perm of PERMISSIONS) {
    await prisma.screenPermission.upsert({
      where: { permissionCode: perm.permissionCode },
      update: { screenName: perm.screenName, description: perm.description },
      create: perm,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} screen permissions upserted`);

  // Seed default role→permission mappings
  const allPerms = await prisma.screenPermission.findMany();
  const permMap = Object.fromEntries(allPerms.map(p => [p.permissionCode, p.id]));

  for (const [role, codes] of Object.entries(ROLE_DEFAULTS)) {
    for (const code of codes) {
      const permissionId = permMap[code];
      if (!permissionId) continue;
      await prisma.userTypePermission.upsert({
        where: { userTypeCode_permissionId: { userTypeCode: role, permissionId } },
        update: { isEnabled: true },
        create: { userTypeCode: role, permissionId, isEnabled: true },
      });
    }
    console.log(`  ✓ ${codes.length} permissions seeded for role: ${role}`);
  }

  console.log('Seeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

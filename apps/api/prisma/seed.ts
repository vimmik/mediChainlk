import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { permissionCode: 'DASHBOARD_VIEW',      screenName: 'Dashboard',             category: 'Overview',      description: 'View the main dashboard' },
  { permissionCode: 'ANALYTICS_VIEW',      screenName: 'Analytics',             category: 'Overview',      description: 'View analytics and reports' },
  { permissionCode: 'REPORTS_VIEW',        screenName: 'Reports',               category: 'Overview',      description: 'View and export reports' },
  { permissionCode: 'PHARMACY_MANAGE',     screenName: 'Pharmacy Management',   category: 'Platform',      description: 'Create and manage pharmacy tenants' },
  { permissionCode: 'USER_MANAGE',         screenName: 'User Management',       category: 'Access',        description: 'Invite, edit, and deactivate users' },
  { permissionCode: 'ROLE_MANAGE',         screenName: 'Role Management',       category: 'Access',        description: 'Create and edit custom roles' },
  { permissionCode: 'MENU_MANAGE',         screenName: 'Menu Management',       category: 'Access',        description: 'Configure the navigation menu tree' },
  { permissionCode: 'PRESCRIPTION_VIEW',   screenName: 'View Prescriptions',    category: 'Prescriptions', description: 'View prescription records' },
  { permissionCode: 'PRESCRIPTION_REVIEW', screenName: 'Review Prescriptions',  category: 'Prescriptions', description: 'Approve or reject prescriptions' },
  { permissionCode: 'AI_PIPELINE_VIEW',    screenName: 'AI Pipeline',           category: 'Prescriptions', description: 'View AI prescription processing pipeline' },
  { permissionCode: 'INVENTORY_VIEW',      screenName: 'View Inventory',        category: 'Inventory',     description: 'View current stock levels' },
  { permissionCode: 'INVENTORY_MANAGE',    screenName: 'Manage Inventory',      category: 'Inventory',     description: 'Adjust stock levels and reorder points' },
  { permissionCode: 'GRN_MANAGE',          screenName: 'GRN Management',        category: 'Inventory',     description: 'Create and approve goods received notes' },
  { permissionCode: 'MEDICINE_MANAGE',     screenName: 'Medicine Management',   category: 'Inventory',     description: 'Manage medicine formulary' },
  { permissionCode: 'ORDER_VIEW',          screenName: 'View Orders',           category: 'Sales',         description: 'View customer orders' },
  { permissionCode: 'ORDER_MANAGE',        screenName: 'Manage Orders',         category: 'Sales',         description: 'Process and update order status' },
  { permissionCode: 'BILLING_VIEW',        screenName: 'View Billing',          category: 'Sales',         description: 'View invoices and billing records' },
  { permissionCode: 'BILLING_MANAGE',      screenName: 'Manage Billing',        category: 'Sales',         description: 'Create invoices and manage payments' },
  { permissionCode: 'DELIVERY_MANAGE',     screenName: 'Manage Delivery',       category: 'Sales',         description: 'Manage delivery providers and dispatch' },
];

/**
 * Menu tree — exactly two nesting levels then a screen:
 *   parent → child → screen
 *
 * Each `screen` links to a permissionCode (must exist in PERMISSIONS above).
 * parent/child rows have no route and no permission — their visibility is
 * derived from whether any descendant screen is permitted.
 *
 * `route` values match the admin-portal Next.js routes.
 */
interface MenuScreen {
  label: string;
  route: string;
  permissionCode: string;
}
interface MenuChild {
  label: string;
  icon?: string;
  screens: MenuScreen[];
}
interface MenuParent {
  label: string;
  icon?: string;
  children: MenuChild[];
}

const MENU_TREE: MenuParent[] = [
  {
    label: 'Overview',
    icon: 'LayoutDashboard',
    children: [
      {
        label: 'Home',
        icon: 'LayoutDashboard',
        screens: [
          { label: 'Dashboard', route: '/dashboard', permissionCode: 'DASHBOARD_VIEW' },
          { label: 'Analytics', route: '/analytics', permissionCode: 'ANALYTICS_VIEW' },
          { label: 'Reports', route: '/reports', permissionCode: 'REPORTS_VIEW' },
        ],
      },
    ],
  },
  {
    label: 'Pharmacies',
    icon: 'Building2',
    children: [
      {
        label: 'Tenant Management',
        icon: 'Building2',
        screens: [
          { label: 'Pharmacies', route: '/tenants', permissionCode: 'PHARMACY_MANAGE' },
        ],
      },
    ],
  },
  {
    label: 'Access Control',
    icon: 'ShieldCheck',
    children: [
      {
        label: 'User & Roles',
        icon: 'Users',
        screens: [
          { label: 'Users', route: '/users', permissionCode: 'USER_MANAGE' },
          { label: 'Roles', route: '/roles', permissionCode: 'ROLE_MANAGE' },
          { label: 'Permissions', route: '/permissions', permissionCode: 'USER_MANAGE' },
        ],
      },
      {
        label: 'System Configuration',
        icon: 'Shield',
        screens: [
          { label: 'Menu Management', route: '/menu', permissionCode: 'MENU_MANAGE' },
        ],
      },
    ],
  },
  {
    label: 'Inventory',
    icon: 'Package',
    children: [
      {
        label: 'Stock Management',
        icon: 'Package',
        screens: [
          { label: 'View Inventory', route: '/inventory', permissionCode: 'INVENTORY_VIEW' },
          { label: 'Stock Adjustment', route: '/inventory/adjustments', permissionCode: 'INVENTORY_MANAGE' },
          { label: 'Goods Receive Note', route: '/inventory/grn', permissionCode: 'GRN_MANAGE' },
        ],
      },
      {
        label: 'Medicine Catalog',
        icon: 'Pill',
        screens: [
          { label: 'Medicines', route: '/medicines', permissionCode: 'MEDICINE_MANAGE' },
        ],
      },
    ],
  },
  {
    label: 'Prescriptions',
    icon: 'ClipboardList',
    children: [
      {
        label: 'Prescription Workflow',
        icon: 'ClipboardList',
        screens: [
          { label: 'View Prescriptions', route: '/prescriptions', permissionCode: 'PRESCRIPTION_VIEW' },
          { label: 'Review Queue', route: '/prescriptions/review', permissionCode: 'PRESCRIPTION_REVIEW' },
          { label: 'AI Pipeline', route: '/prescriptions/ai-pipeline', permissionCode: 'AI_PIPELINE_VIEW' },
        ],
      },
    ],
  },
  {
    label: 'Sales',
    icon: 'ShoppingCart',
    children: [
      {
        label: 'Order Management',
        icon: 'ShoppingCart',
        screens: [
          { label: 'Orders', route: '/orders', permissionCode: 'ORDER_VIEW' },
          { label: 'Process Orders', route: '/orders/process', permissionCode: 'ORDER_MANAGE' },
        ],
      },
      {
        label: 'Billing & Delivery',
        icon: 'CreditCard',
        screens: [
          { label: 'Invoices', route: '/billing', permissionCode: 'BILLING_VIEW' },
          { label: 'Manage Billing', route: '/billing/manage', permissionCode: 'BILLING_MANAGE' },
          { label: 'Delivery', route: '/delivery', permissionCode: 'DELIVERY_MANAGE' },
        ],
      },
    ],
  },
];

/**
 * System roles — one per role-string. isSystem=true, tenantId=null.
 * The `name` matches the role string so guards keep working unchanged.
 */
const SYSTEM_ROLES: Array<{
  name: string;
  scope: 'system' | 'tenant' | 'branch' | 'customer';
  description: string;
}> = [
  { name: 'system_admin',   scope: 'system',   description: 'Platform-wide administrator. Full access across all tenants.' },
  { name: 'pharmacy_admin', scope: 'tenant',   description: 'Manages every branch of a single pharmacy tenant.' },
  { name: 'pharmacy_staff', scope: 'branch',   description: 'Works at one or more specific branches. Branch-level data access only.' },
  { name: 'customer',       scope: 'customer', description: 'Mobile app end-user. No tenant or staff features.' },
];

// Default permissions per role
const ROLE_DEFAULTS: Record<string, string[]> = {
  system_admin: PERMISSIONS.map(p => p.permissionCode), // all
  pharmacy_admin: [
    'DASHBOARD_VIEW',
    'ANALYTICS_VIEW',
    'USER_MANAGE',
    'ROLE_MANAGE',
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
      update: { screenName: perm.screenName, description: perm.description, category: perm.category },
      create: perm,
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} screen permissions upserted`);

  // Build permissionCode → id lookup
  const allPerms = await prisma.screenPermission.findMany();
  const permMap = Object.fromEntries(allPerms.map(p => [p.permissionCode, p.id]));

  // Legacy UserTypePermission mappings — keep for backwards compat
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
    console.log(`  ✓ ${codes.length} legacy permissions seeded for role: ${role}`);
  }

  // ── Seed system Roles ────────────────────────────────────────────────────
  console.log('\nSeeding system Role records...');
  for (const r of SYSTEM_ROLES) {
    // tenantId IS NULL for system roles — Postgres unique constraints treat NULL
    // as distinct, so upsert by (tenantId, name) won't work. Use findFirst then create/update.
    const existing = await prisma.role.findFirst({
      where: { name: r.name, tenantId: null, isSystem: true },
    });

    const role = existing
      ? await prisma.role.update({
          where: { id: existing.id },
          data: { description: r.description, scope: r.scope, isActive: true },
        })
      : await prisma.role.create({
          data: {
            name: r.name,
            description: r.description,
            scope: r.scope,
            isSystem: true,
            tenantId: null,
            isActive: true,
          },
        });

    // Sync RolePermission rows from ROLE_DEFAULTS (idempotent — add missing, leave others)
    const desiredCodes = ROLE_DEFAULTS[r.name] ?? [];
    const desiredIds = desiredCodes
      .map((c) => permMap[c])
      .filter((id): id is string => Boolean(id));

    const existingLinks = await prisma.rolePermission.findMany({ where: { roleId: role.id } });
    const existingIds = new Set(existingLinks.map((l) => l.permissionId));

    const toAdd = desiredIds.filter((id) => !existingIds.has(id));
    const toRemove = existingLinks.filter((l) => !desiredIds.includes(l.permissionId));

    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length > 0) {
      await prisma.rolePermission.deleteMany({
        where: { id: { in: toRemove.map((l) => l.id) } },
      });
    }

    console.log(
      `  ✓ Role "${r.name}" (scope=${r.scope}) → ${desiredIds.length} permissions ` +
      `[+${toAdd.length} added, -${toRemove.length} removed]`,
    );
  }

  // ── Backfill User.roleId from role string ────────────────────────────────
  console.log('\nBackfilling User.roleId from role string...');
  const systemRoles = await prisma.role.findMany({
    where: { isSystem: true, tenantId: null },
    select: { id: true, name: true },
  });
  const roleIdByName = Object.fromEntries(systemRoles.map((r) => [r.name, r.id]));

  // Only update users whose roleId is currently NULL — don't override custom-role assignments
  let updated = 0;
  for (const [name, id] of Object.entries(roleIdByName)) {
    const res = await prisma.user.updateMany({
      where: { role: name, roleId: null },
      data: { roleId: id },
    });
    updated += res.count;
    if (res.count > 0) {
      console.log(`  ✓ ${res.count} user(s) backfilled with roleId for "${name}"`);
    }
  }
  if (updated === 0) {
    console.log('  ✓ No users needed backfilling — all already have a roleId or no users exist');
  }

  // ── Seed the menu tree ───────────────────────────────────────────────────
  // Strategy: the tree is fully described by MENU_TREE. We upsert by a
  // deterministic natural key (parent.label / child.label / screen.route) so
  // re-running the seed is idempotent and keeps existing IDs stable.
  console.log('\nSeeding menu tree...');
  const permIdByCode = Object.fromEntries(allPerms.map((p) => [p.permissionCode, p.id]));

  let parentSort = 0;
  let menuCounts = { parent: 0, child: 0, screen: 0 };

  for (const parent of MENU_TREE) {
    // Parent — keyed by (type='parent', label)
    let parentRow = await prisma.menuItem.findFirst({
      where: { type: 'parent', label: parent.label, parentId: null },
    });
    parentRow = parentRow
      ? await prisma.menuItem.update({
          where: { id: parentRow.id },
          data: { icon: parent.icon, sortOrder: parentSort, isActive: true },
        })
      : await prisma.menuItem.create({
          data: {
            type: 'parent',
            label: parent.label,
            icon: parent.icon,
            sortOrder: parentSort,
          },
        });
    menuCounts.parent++;
    parentSort++;

    let childSort = 0;
    for (const child of parent.children) {
      // Child — keyed by (type='child', label, parentId)
      let childRow = await prisma.menuItem.findFirst({
        where: { type: 'child', label: child.label, parentId: parentRow.id },
      });
      childRow = childRow
        ? await prisma.menuItem.update({
            where: { id: childRow.id },
            data: { icon: child.icon, sortOrder: childSort, isActive: true },
          })
        : await prisma.menuItem.create({
            data: {
              type: 'child',
              label: child.label,
              icon: child.icon,
              parentId: parentRow.id,
              sortOrder: childSort,
            },
          });
      menuCounts.child++;
      childSort++;

      let screenSort = 0;
      for (const screen of child.screens) {
        const permissionId = permIdByCode[screen.permissionCode];
        if (!permissionId) {
          console.warn(`  ⚠ screen "${screen.label}" → unknown permission "${screen.permissionCode}", skipping`);
          continue;
        }
        // Screen — keyed by (type='screen', route)
        const existingScreen = await prisma.menuItem.findFirst({
          where: { type: 'screen', route: screen.route },
        });
        if (existingScreen) {
          await prisma.menuItem.update({
            where: { id: existingScreen.id },
            data: {
              label: screen.label,
              parentId: childRow.id,
              permissionId,
              sortOrder: screenSort,
              isActive: true,
            },
          });
        } else {
          await prisma.menuItem.create({
            data: {
              type: 'screen',
              label: screen.label,
              route: screen.route,
              parentId: childRow.id,
              permissionId,
              sortOrder: screenSort,
            },
          });
        }
        menuCounts.screen++;
        screenSort++;
      }
    }
  }
  console.log(
    `  ✓ Menu tree seeded — ${menuCounts.parent} parents, ${menuCounts.child} children, ${menuCounts.screen} screens`,
  );

  console.log('\nSeeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

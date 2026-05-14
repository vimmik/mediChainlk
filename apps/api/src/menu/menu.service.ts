import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

// ─── Shapes returned to clients ──────────────────────────────────────────────

export interface MenuScreenNode {
  id: string;
  type: 'screen';
  label: string;
  route: string | null;
  permissionId: string | null;
  permissionCode: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuChildNode {
  id: string;
  type: 'child';
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  screens: MenuScreenNode[];
}

export interface MenuParentNode {
  id: string;
  type: 'parent';
  label: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  children: MenuChildNode[];
}

type RawMenuItem = {
  id: string;
  type: string;
  label: string;
  icon: string | null;
  parentId: string | null;
  route: string | null;
  permissionId: string | null;
  sortOrder: number;
  isActive: boolean;
  permission: { permissionCode: string } | null;
};

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tree assembly ────────────────────────────────────────────────────────

  /**
   * Build the nested parent → child → screen tree from a flat list.
   * `permittedCodes`, when provided, prunes screens the user can't access and
   * then drops any child/parent left with no visible screens.
   */
  private assembleTree(
    items: RawMenuItem[],
    permittedCodes?: Set<string>,
  ): MenuParentNode[] {
    const byParent = new Map<string | null, RawMenuItem[]>();
    for (const it of items) {
      const key = it.parentId;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(it);
    }
    const sortItems = (a: RawMenuItem, b: RawMenuItem) =>
      a.sortOrder - b.sortOrder || a.label.localeCompare(b.label);

    const parents = (byParent.get(null) ?? [])
      .filter((p) => p.type === 'parent' && p.isActive)
      .sort(sortItems);

    const tree: MenuParentNode[] = [];

    for (const parent of parents) {
      const childRows = (byParent.get(parent.id) ?? [])
        .filter((c) => c.type === 'child' && c.isActive)
        .sort(sortItems);

      const children: MenuChildNode[] = [];

      for (const child of childRows) {
        const screenRows = (byParent.get(child.id) ?? [])
          .filter((s) => s.type === 'screen' && s.isActive)
          .sort(sortItems);

        const screens: MenuScreenNode[] = screenRows
          .filter((s) => {
            // No permission filter → include everything (admin full-tree view)
            if (!permittedCodes) return true;
            // Screen with no linked permission is hidden from permission-scoped
            // views — it's not navigable until an admin links a permission.
            if (!s.permission) return false;
            return permittedCodes.has(s.permission.permissionCode);
          })
          .map((s) => ({
            id: s.id,
            type: 'screen' as const,
            label: s.label,
            route: s.route,
            permissionId: s.permissionId,
            permissionCode: s.permission?.permissionCode ?? null,
            sortOrder: s.sortOrder,
            isActive: s.isActive,
          }));

        // Prune empty children only when filtering by permission
        if (permittedCodes && screens.length === 0) continue;

        children.push({
          id: child.id,
          type: 'child',
          label: child.label,
          icon: child.icon,
          sortOrder: child.sortOrder,
          isActive: child.isActive,
          screens,
        });
      }

      // Prune empty parents only when filtering by permission
      if (permittedCodes && children.length === 0) continue;

      tree.push({
        id: parent.id,
        type: 'parent',
        label: parent.label,
        icon: parent.icon,
        sortOrder: parent.sortOrder,
        isActive: parent.isActive,
        children,
      });
    }

    return tree;
  }

  // ─── Full tree (admin view) ───────────────────────────────────────────────

  /** Every menu item, nested — for the menu-management UI. No permission filter. */
  async getFullTree(): Promise<MenuParentNode[]> {
    const items = (await this.prisma.menuItem.findMany({
      include: { permission: { select: { permissionCode: true } } },
    })) as RawMenuItem[];
    return this.assembleTree(items);
  }

  // ─── Permission-scoped tree (for /me/menu) ────────────────────────────────

  /** The menu tree a user with `permittedCodes` should see. Empty branches pruned. */
  async getMenuForPermissions(permittedCodes: string[]): Promise<MenuParentNode[]> {
    const items = (await this.prisma.menuItem.findMany({
      where: { isActive: true },
      include: { permission: { select: { permissionCode: true } } },
    })) as RawMenuItem[];
    return this.assembleTree(items, new Set(permittedCodes));
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateMenuItemDto) {
    await this.validateHierarchy(dto.type, dto.parentId);

    // ── parent / child — no route, no permission ─────────────────────────────
    if (dto.type !== 'screen') {
      if (dto.route || dto.permissionId || dto.newPermission) {
        throw new BadRequestException(
          `${dto.type} items cannot have a route or permission`,
        );
      }
      return this.prisma.menuItem.create({
        data: {
          type: dto.type,
          label: dto.label,
          icon: dto.icon,
          parentId: dto.parentId ?? null,
          route: null,
          permissionId: null,
          sortOrder: dto.sortOrder ?? (await this.nextSortOrder(dto.parentId ?? null)),
          isActive: dto.isActive ?? true,
        },
        include: { permission: { select: { permissionCode: true } } },
      });
    }

    // ── screen — needs a route + exactly one of permissionId | newPermission ─
    if (!dto.route) throw new BadRequestException('`route` is required for screen items');
    if (dto.permissionId && dto.newPermission) {
      throw new BadRequestException(
        'Provide either permissionId (existing) or newPermission (create), not both',
      );
    }
    if (!dto.permissionId && !dto.newPermission) {
      throw new BadRequestException(
        'A screen needs either permissionId (existing) or newPermission (create)',
      );
    }

    // Route must be unique across screens — two menu items can't point at the
    // same URL or the sidebar active-state breaks.
    const routeClash = await this.prisma.menuItem.findFirst({
      where: { type: 'screen', route: dto.route },
      select: { id: true },
    });
    if (routeClash) {
      throw new ConflictException(`A screen with route "${dto.route}" already exists`);
    }

    if (dto.permissionId) {
      await this.assertPermissionExists(dto.permissionId);
      return this.prisma.menuItem.create({
        data: {
          type: 'screen',
          label: dto.label,
          icon: null,
          parentId: dto.parentId ?? null,
          route: dto.route,
          permissionId: dto.permissionId,
          sortOrder: dto.sortOrder ?? (await this.nextSortOrder(dto.parentId ?? null)),
          isActive: dto.isActive ?? true,
        },
        include: { permission: { select: { permissionCode: true } } },
      });
    }

    // ── Atomic: create the new ScreenPermission + the screen MenuItem ─────────
    // This is the "new screens auto-save their permission" guarantee — either
    // both rows land in the DB or neither does.
    const np = dto.newPermission!;
    const sortOrder = dto.sortOrder ?? (await this.nextSortOrder(dto.parentId ?? null));

    return this.prisma.$transaction(async (tx) => {
      const codeClash = await tx.screenPermission.findUnique({
        where: { permissionCode: np.permissionCode },
        select: { id: true },
      });
      if (codeClash) {
        throw new ConflictException(
          `Permission code "${np.permissionCode}" already exists — pick it from the existing list instead`,
        );
      }

      const permission = await tx.screenPermission.create({
        data: {
          permissionCode: np.permissionCode,
          screenName: np.screenName,
          description: np.description,
          category: np.category,
        },
      });

      return tx.menuItem.create({
        data: {
          type: 'screen',
          label: dto.label,
          icon: null,
          parentId: dto.parentId ?? null,
          route: dto.route,
          permissionId: permission.id,
          sortOrder,
          isActive: dto.isActive ?? true,
        },
        include: { permission: { select: { permissionCode: true } } },
      });
    });
  }

  /** Next sortOrder value for a new sibling under `parentId` (append to end). */
  private async nextSortOrder(parentId: string | null): Promise<number> {
    const last = await this.prisma.menuItem.findFirst({
      where: { parentId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    return last ? last.sortOrder + 1 : 0;
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Menu item not found');

    if (existing.type === 'screen') {
      if (dto.permissionId) await this.assertPermissionExists(dto.permissionId);
      // Route uniqueness — a changed route can't collide with another screen
      if (dto.route && dto.route !== existing.route) {
        const clash = await this.prisma.menuItem.findFirst({
          where: { type: 'screen', route: dto.route, NOT: { id } },
          select: { id: true },
        });
        if (clash) {
          throw new ConflictException(`A screen with route "${dto.route}" already exists`);
        }
      }
    } else if (dto.route || dto.permissionId) {
      throw new BadRequestException(`${existing.type} items cannot have a route or permission`);
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        label: dto.label,
        icon: dto.icon,
        route: existing.type === 'screen' ? dto.route : undefined,
        permissionId: existing.type === 'screen' ? dto.permissionId : undefined,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: { permission: { select: { permissionCode: true } } },
    });
  }

  /**
   * Reorder a set of sibling menu items. All items must share the same parent —
   * the request is rejected otherwise so reordering can never move an item
   * across branches. Applied in a single transaction.
   */
  async reorder(dto: ReorderMenuDto) {
    const ids = dto.items.map((i) => i.id);
    const rows = await this.prisma.menuItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, parentId: true },
    });

    if (rows.length !== ids.length) {
      throw new BadRequestException('One or more menu item IDs do not exist');
    }

    // All siblings → identical parentId
    const parentIds = new Set(rows.map((r) => r.parentId));
    if (parentIds.size > 1) {
      throw new BadRequestException('All reordered items must share the same parent');
    }

    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.menuItem.update({
          where: { id: i.id },
          data: { sortOrder: i.sortOrder },
        }),
      ),
    );

    return { updated: dto.items.length };
  }

  async delete(id: string) {
    const existing = await this.prisma.menuItem.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } },
    });
    if (!existing) throw new NotFoundException('Menu item not found');

    // The DB FK is ON DELETE CASCADE, so deleting a parent would wipe its whole
    // subtree silently. Refuse unless the caller deletes leaves first — safer.
    if (existing._count.children > 0) {
      throw new BadRequestException(
        `Cannot delete "${existing.label}" — it has ${existing._count.children} child item(s). ` +
        `Delete or move them first.`,
      );
    }

    await this.prisma.menuItem.delete({ where: { id } });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Enforce the 2-level invariant: parent→null, child→parent, screen→child. */
  private async validateHierarchy(type: string, parentId?: string): Promise<void> {
    if (type === 'parent') {
      if (parentId) throw new BadRequestException('parent items cannot have a parentId');
      return;
    }

    if (!parentId) {
      throw new BadRequestException(`${type} items require a parentId`);
    }
    const parent = await this.prisma.menuItem.findUnique({
      where: { id: parentId },
      select: { type: true },
    });
    if (!parent) throw new NotFoundException(`Parent menu item ${parentId} not found`);

    if (type === 'child' && parent.type !== 'parent') {
      throw new BadRequestException('child items must be nested under a `parent`');
    }
    if (type === 'screen' && parent.type !== 'child') {
      throw new BadRequestException('screen items must be nested under a `child`');
    }
  }

  private async assertPermissionExists(permissionId: string): Promise<void> {
    const perm = await this.prisma.screenPermission.findUnique({
      where: { id: permissionId },
      select: { id: true },
    });
    if (!perm) throw new BadRequestException(`Permission ${permissionId} not found`);
  }
}

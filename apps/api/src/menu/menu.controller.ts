import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RedisService } from '../redis/redis.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { MenuService } from './menu.service';

const SESSION_COOKIE = '__session';

interface AuthRequest extends Request {
  user: { firebaseUid: string; role: string; permissions: string[] };
}

@ApiTags('Menu')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller()
export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly redis: RedisService,
  ) {}

  // ─── /me/menu — the permitted, pruned tree for the current user ──────────

  @Get('me/menu')
  @Roles('system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer')
  @ApiOperation({
    summary:
      'Get the nested menu tree (parent → child → screen) the current user is permitted to see. Empty branches are pruned.',
  })
  async myMenu(@Req() req: AuthRequest) {
    // Permissions are authoritative in the Redis session (the guard leaves
    // req.user.permissions empty for the cookie path). Read them from there;
    // fall back to whatever the guard attached for the bearer-token path.
    let permissions = req.user.permissions ?? [];

    const sessionId = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (sessionId) {
      const session = await this.redis.getSession(sessionId);
      if (session) permissions = session.permissions ?? [];
    }

    return this.menuService.getMenuForPermissions(permissions);
  }

  // ─── Admin menu management — full tree + CRUD ────────────────────────────

  @Get('menu')
  @Roles('system_admin')
  @ApiOperation({ summary: 'Get the FULL menu tree (admin management view, no permission filter)' })
  fullTree() {
    return this.menuService.getFullTree();
  }

  @Post('menu')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({
    summary:
      'Create a menu item. For `screen` type, pass permissionId (link existing) OR newPermission (create+link atomically).',
  })
  create(@Body() dto: CreateMenuItemDto) {
    return this.menuService.create(dto);
  }

  @Put('menu/reorder')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'Reorder a set of sibling menu items (same parent only)' })
  reorder(@Body() dto: ReorderMenuDto) {
    return this.menuService.reorder(dto);
  }

  @Put('menu/:id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'Update a menu item (type is immutable)' })
  update(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.update(id, dto);
  }

  @Delete('menu/:id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a menu item (rejects if it still has children)' })
  delete(@Param('id') id: string) {
    return this.menuService.delete(id);
  }
}

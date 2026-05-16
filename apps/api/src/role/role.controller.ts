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
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService, CallerContext } from './role.service';

interface AuthRequest {
  user: CallerContext;
}

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List roles visible to the caller' })
  findAll(@Query() query: ListRolesQueryDto, @Request() req: AuthRequest) {
    return this.roleService.findAll(query, req.user);
  }

  @Get(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get a single role with its permissions' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roleService.findById(id, req.user);
  }

  @Post()
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({ summary: 'Create a new role (custom; system roles are seed-only)' })
  create(@Body() dto: CreateRoleDto, @Request() req: AuthRequest) {
    return this.roleService.create(dto, req.user);
  }

  @Put(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Update a role (rename, description, permissions, active flag)' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @Request() req: AuthRequest) {
    return this.roleService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete a role (marks inactive). Rejects if users are still assigned.',
  })
  delete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.roleService.delete(id, req.user);
  }
}

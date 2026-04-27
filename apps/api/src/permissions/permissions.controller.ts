import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles('system_admin')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all screen permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get all permissions for a specific role with enabled/disabled state' })
  findByRole(@Param('role') role: string) {
    return this.permissionsService.findByRole(role);
  }

  @Put('role/:role')
  @ApiOperation({ summary: 'Enable or disable permissions for a role' })
  updateRolePermissions(
    @Param('role') role: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(role, dto);
  }
}

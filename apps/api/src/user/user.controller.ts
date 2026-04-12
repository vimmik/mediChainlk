import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

interface AuthRequest {
  user: { firebaseUid: string; role: string; tenantId?: string | null };
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List users — system_admin sees all, pharmacy_admin sees own tenant only' })
  findAll(@Query() query: ListUsersQueryDto, @Request() req: AuthRequest) {
    return this.userService.findAll(query, req.user);
  }

  @Get(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get full user profile by ID' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userService.findById(id, req.user);
  }

  @Post()
  @Roles('system_admin')
  @ApiOperation({ summary: 'Create a user record directly (internal use)' })
  create(@Body() dto: CreateUserDto, @CurrentTenant() tenantId: string) {
    return this.userService.create(dto, tenantId);
  }

  @Post('invite')
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Invite a new user: creates Firebase account + sets Custom Claims + DB record' })
  invite(@Body() dto: InviteUserDto, @Request() req: AuthRequest) {
    return this.userService.invite(dto, req.user);
  }

  @Put(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Update user profile and/or role' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: AuthRequest) {
    return this.userService.update(id, dto, req.user);
  }

  @Patch(':id/deactivate')
  @Roles('system_admin', 'pharmacy_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-deactivate a user (isActive = false, Firebase disabled)' })
  deactivate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userService.deactivate(id, req.user);
  }

  @Patch(':id/reactivate')
  @Roles('system_admin', 'pharmacy_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a deactivated user' })
  reactivate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userService.reactivate(id, req.user);
  }

  @Delete(':id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete user from Firebase Auth and database (system_admin only)' })
  hardDelete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userService.hardDelete(id, req.user);
  }
}

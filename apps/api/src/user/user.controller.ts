import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/tenant.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { GetUserUseCase } from './application/use-cases/get-user.use-case';
import { InviteUserUseCase } from './application/use-cases/invite-user.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { UserStatusUseCase } from './application/use-cases/user-status.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface AuthRequest {
  user: { firebaseUid: string; role: string; tenantId?: string | null };
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly inviteUser: InviteUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly userStatus: UserStatusUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Get()
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'List users — system_admin sees all, pharmacy_admin sees own tenant only' })
  findAll(@Query() query: ListUsersQueryDto, @Request() req: AuthRequest) {
    return this.listUsers.execute(query, req.user);
  }

  @Get(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Get full user profile by ID' })
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.getUser.execute(id, req.user);
  }

  @Post()
  @Roles('system_admin')
  @ApiOperation({ summary: 'Create a user record directly (internal use)' })
  create(@Body() dto: CreateUserDto, @CurrentTenant() tenantId: string) {
    return this.createUser.execute(dto, tenantId);
  }

  @Post('invite')
  @Roles('system_admin', 'pharmacy_admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Invite a new user: creates Firebase account + sets Custom Claims + DB record' })
  invite(@Body() dto: InviteUserDto, @Request() req: AuthRequest) {
    return this.inviteUser.execute(dto, req.user);
  }

  @Put(':id')
  @Roles('system_admin', 'pharmacy_admin')
  @ApiOperation({ summary: 'Update user profile and/or role' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: AuthRequest) {
    return this.updateUser.execute(id, dto, req.user);
  }

  @Patch(':id/deactivate')
  @Roles('system_admin', 'pharmacy_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-deactivate a user (isActive = false, Firebase disabled)' })
  deactivate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userStatus.deactivate(id, req.user);
  }

  @Patch(':id/reactivate')
  @Roles('system_admin', 'pharmacy_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a deactivated user' })
  reactivate(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.userStatus.reactivate(id, req.user);
  }

  @Delete(':id')
  @Roles('system_admin')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hard-delete user from Firebase Auth and database (system_admin only)' })
  hardDelete(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.deleteUser.execute(id, req.user);
  }
}

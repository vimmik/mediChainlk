import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentTenant } from '../common/decorators/tenant.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentTenant() tenantId: string) {
    return this.userService.create(dto, tenantId);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.userService.findByTenant(tenantId);
  }
}

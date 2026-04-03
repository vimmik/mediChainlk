import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, tenantId: string) {
    return this.prisma.user.create({
      data: { ...dto, tenantId },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
    });
  }
}

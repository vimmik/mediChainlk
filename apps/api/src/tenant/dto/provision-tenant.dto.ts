import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateTenantContactDto } from './tenant-contact.dto';
import { CreateTenantDto } from './create-tenant.dto';
import { CreateTenantOwnerDto } from './create-tenant-owner.dto';

export class ProvisionTenantDto {
  @ApiProperty({ type: CreateTenantDto })
  @ValidateNested()
  @Type(() => CreateTenantDto)
  tenant!: CreateTenantDto;

  @ApiPropertyOptional({ type: CreateTenantOwnerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTenantOwnerDto)
  owner?: CreateTenantOwnerDto;

  @ApiPropertyOptional({ type: [CreateTenantContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTenantContactDto)
  contacts?: CreateTenantContactDto[];
}

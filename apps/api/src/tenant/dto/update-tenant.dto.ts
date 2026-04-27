import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'ABC Pharmacy' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional({ example: 'abc-pharmacy' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens only' })
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  legalName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  registrationNo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  taxId?: string;

  @ApiPropertyOptional({ enum: ['sole_proprietorship', 'partnership', 'pvt_ltd', 'plc'] })
  @IsString()
  @IsOptional()
  @IsIn(['sole_proprietorship', 'partnership', 'pvt_ltd', 'plc'])
  businessType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'logoUrl must be a valid URL' })
  @MaxLength(2048)
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'website must be a valid URL' })
  @MaxLength(2048)
  website?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  district?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  province?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(16)
  @Matches(/^[0-9]{4,10}$/, { message: 'postalCode must be 4-10 digits' })
  postalCode?: string;

  @ApiPropertyOptional({ enum: ['free', 'basic', 'professional', 'enterprise'] })
  @IsString()
  @IsOptional()
  @IsIn(['free', 'basic', 'professional', 'enterprise'])
  subscriptionPlan?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'ABC Pharmacy' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;

  @ApiProperty({ example: 'abc-pharmacy', description: 'URL-safe slug, lowercase with hyphens' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens only' })
  slug!: string;

  @ApiPropertyOptional({ example: 'ABC Pharmacy (Pvt) Ltd' })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  legalName?: string;

  @ApiPropertyOptional({ example: 'PV00123456' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  registrationNo?: string;

  @ApiPropertyOptional({ example: '123456789-0000' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  taxId?: string;

  @ApiPropertyOptional({ enum: ['sole_proprietorship', 'partnership', 'pvt_ltd', 'plc'], default: 'sole_proprietorship' })
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

  @ApiPropertyOptional({ example: 'https://abcpharmacy.lk' })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'website must be a valid URL' })
  @MaxLength(2048)
  website?: string;

  @ApiPropertyOptional({ example: 'info@abcpharmacy.lk' })
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiPropertyOptional({ example: '+94112345678' })
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

  @ApiPropertyOptional({ example: 'Colombo' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  city?: string;

  @ApiPropertyOptional({ example: 'Colombo' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  district?: string;

  @ApiPropertyOptional({ example: 'Western' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  province?: string;

  @ApiPropertyOptional({ example: '10100' })
  @IsString()
  @IsOptional()
  @MaxLength(16)
  @Matches(/^[0-9]{4,10}$/, { message: 'postalCode must be 4-10 digits' })
  postalCode?: string;

  @ApiPropertyOptional({ enum: ['free', 'basic', 'professional', 'enterprise'], default: 'free' })
  @IsString()
  @IsOptional()
  @IsIn(['free', 'basic', 'professional', 'enterprise'])
  subscriptionPlan?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

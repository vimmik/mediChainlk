import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class UpdateBranchDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'branchCode must contain only alphanumeric characters, hyphens, or underscores' })
  branchCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(512)
  address?: string;

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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  licenseNo?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  pharmacistName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9\-/]+$/, { message: 'pharmacistRegNo must contain only alphanumeric characters, hyphens, or slashes' })
  pharmacistRegNo?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openingTime must be in HH:MM format (24h)' })
  openingTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closingTime must be in HH:MM format (24h)' })
  closingTime?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOpen24h?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isMainBranch?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

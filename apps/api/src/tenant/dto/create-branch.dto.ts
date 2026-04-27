import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'ABC Colombo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional({ example: 'COL-001' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9\-_]+$/, { message: 'branchCode must contain only alphanumeric characters, hyphens, or underscores' })
  branchCode?: string;

  @ApiProperty({ example: '123 Main Street, Colombo 03' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  addressLine2?: string;

  @ApiProperty({ example: 'Colombo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  city!: string;

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

  @ApiProperty({ example: '+94112345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone!: string;

  @ApiPropertyOptional({ example: 'colombo@abcpharmacy.lk' })
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiProperty({ example: 'PH-LK-2024-001', description: 'Pharmacy license number (unique per branch)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  licenseNo!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  licenseExpiry?: string;

  @ApiPropertyOptional({ example: 'Dr. Kamal Fernando' })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  pharmacistName?: string;

  @ApiPropertyOptional({ example: 'SLMC-54321' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9\-/]+$/, { message: 'pharmacistRegNo must contain only alphanumeric characters, hyphens, or slashes' })
  pharmacistRegNo?: string;

  @ApiPropertyOptional({ description: 'Decimal degrees, -90 to 90' })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Decimal degrees, -180 to 180' })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: '08:00', description: 'HH:MM format' })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openingTime must be in HH:MM format (24h)' })
  openingTime?: string;

  @ApiPropertyOptional({ example: '21:00', description: 'HH:MM format' })
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
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTenantOwnerDto {
  @ApiProperty({ example: 'Dr. Amal Perera' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  fullName!: string;

  @ApiPropertyOptional({ example: '199012345678' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^[0-9Vv]{9,12}$/, { message: 'nic must be a valid Sri Lankan NIC (9-12 characters)' })
  nic?: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'amal@example.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiPropertyOptional({ example: 'SLMC-12345' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9\-/]+$/, { message: 'slmcRegNo must contain only alphanumeric characters, hyphens, or slashes' })
  slmcRegNo?: string;

  @ApiPropertyOptional({ example: 'B.Pharm' })
  @IsString()
  @IsOptional()
  @MaxLength(256)
  qualification?: string;

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
}

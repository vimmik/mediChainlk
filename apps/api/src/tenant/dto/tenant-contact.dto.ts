import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateTenantContactDto {
  @ApiProperty({ enum: ['primary', 'billing', 'technical', 'emergency'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['primary', 'billing', 'technical', 'emergency'])
  contactType!: string;

  @ApiProperty({ example: 'Nimal Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name!: string;

  @ApiPropertyOptional({ example: 'Accountant' })
  @IsString()
  @IsOptional()
  @MaxLength(128)
  designation?: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'nimal@example.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(256)
  email?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateTenantContactDto {
  @ApiPropertyOptional({ enum: ['primary', 'billing', 'technical', 'emergency'] })
  @IsString()
  @IsOptional()
  @IsIn(['primary', 'billing', 'technical', 'emergency'])
  contactType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  designation?: string;

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
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

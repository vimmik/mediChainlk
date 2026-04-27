import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ enum: ['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer'] })
  @IsIn(['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer'])
  role!: string;

  @ApiPropertyOptional({ description: 'Required for pharmacy_admin and pharmacy_staff roles' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

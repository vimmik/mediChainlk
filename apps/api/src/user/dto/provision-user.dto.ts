import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * One branch assignment row for a pharmacy_staff or branch-scoped user.
 * pharmacy_admin does not need explicit branch rows (they get tenant-wide access).
 */
export class ProvisionBranchAssignmentDto {
  @ApiProperty({ description: 'Branch ID under the chosen tenant' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiPropertyOptional({ description: 'Mark this branch as the user\'s "home" branch' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class ProvisionUserDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(256)
  email!: string;

  @ApiProperty({ minLength: 8, description: 'Temporary password — user should change on first login' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(128)
  lastName?: string;

  @ApiPropertyOptional({ example: '+94771234567' })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  @Matches(/^\+?[0-9\s\-().]{7,32}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @ApiProperty({ enum: ['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer'] })
  @IsIn(['system_admin', 'pharmacy_admin', 'pharmacy_staff', 'customer'])
  role!: string;

  @ApiPropertyOptional({
    description:
      'Optional Role ID (custom or system). When omitted, the seeded system role matching ' +
      '`role` is auto-assigned.',
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Required for pharmacy_admin and pharmacy_staff' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  /**
   * Branch assignments — required for pharmacy_staff, optional for pharmacy_admin
   * (admins implicitly cover all tenant branches). Ignored for system_admin & customer.
   */
  @ApiPropertyOptional({ type: [ProvisionBranchAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProvisionBranchAssignmentDto)
  branchAssignments?: ProvisionBranchAssignmentDto[];

  @ApiPropertyOptional({ description: 'Send Firebase password reset email so user can pick their own password' })
  @IsOptional()
  @IsBoolean()
  sendPasswordReset?: boolean;
}

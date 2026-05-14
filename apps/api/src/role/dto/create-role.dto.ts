import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export const ROLE_SCOPES = ['system', 'tenant', 'branch', 'customer'] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

export class CreateRoleDto {
  @ApiProperty({ example: 'Cashier', description: 'Display name; unique per tenant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9 _-]+$/, {
    message: 'name may only contain letters, numbers, spaces, underscores, and hyphens',
  })
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: ROLE_SCOPES })
  @IsIn(ROLE_SCOPES as unknown as string[])
  scope!: RoleScope;

  @ApiPropertyOptional({
    description: 'Only system_admin can target a specific tenant; pharmacy_admin is always forced to their own',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ type: [String], description: 'ScreenPermission IDs granted by this role' })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

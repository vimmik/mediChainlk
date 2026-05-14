import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const MENU_ITEM_TYPES = ['parent', 'child', 'screen'] as const;
export type MenuItemType = (typeof MENU_ITEM_TYPES)[number];

/**
 * Inline permission definition — used when adding a `screen` that needs a
 * brand-new ScreenPermission. The service creates the permission AND the
 * menu item atomically in one transaction, so a new screen never lands in
 * the DB without its permission.
 */
export class NewScreenPermissionDto {
  @ApiProperty({ example: 'GRN_VIEW', description: 'Unique permission code (UPPER_SNAKE_CASE)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'permissionCode must be UPPER_SNAKE_CASE (e.g. GRN_VIEW)',
  })
  permissionCode!: string;

  @ApiProperty({ example: 'View Goods Receive Notes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  screenName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string;

  @ApiPropertyOptional({ description: 'UI grouping bucket, e.g. "Inventory"' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;
}

export class CreateMenuItemDto {
  @ApiProperty({ enum: MENU_ITEM_TYPES })
  @IsIn(MENU_ITEM_TYPES as unknown as string[])
  type!: MenuItemType;

  @ApiProperty({ example: 'Goods Receive Note' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  label!: string;

  @ApiPropertyOptional({ description: 'lucide-react icon name (parent/child only)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent menu item ID. null for top-level parents.' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Route — required for `screen` type, ignored otherwise' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  route?: string;

  @ApiPropertyOptional({
    description:
      'ScreenPermission ID — for `screen` type, supply EITHER permissionId (link existing) OR newPermission (create + link). Not both.',
  })
  @IsOptional()
  @IsString()
  permissionId?: string;

  @ApiPropertyOptional({
    type: NewScreenPermissionDto,
    description:
      'Inline new permission — for `screen` type. Created and linked atomically with the menu item.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewScreenPermissionDto)
  newPermission?: NewScreenPermissionDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

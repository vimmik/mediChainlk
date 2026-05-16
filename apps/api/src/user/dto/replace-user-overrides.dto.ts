import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

/** A single explicit override. `isGranted=true` force-grants, false force-revokes. */
export class UserPermissionOverrideItemDto {
  @ApiProperty({ description: 'ScreenPermission ID' })
  @IsString()
  @IsNotEmpty()
  permissionId!: string;

  @ApiProperty({ description: 'true → force grant; false → force revoke' })
  @IsBoolean()
  isGranted!: boolean;
}

/**
 * Bulk-replace a user's overrides. The full list is the new state — any existing
 * override not present here is deleted.
 */
export class ReplaceUserOverridesDto {
  @ApiProperty({ type: [UserPermissionOverrideItemDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique((o: UserPermissionOverrideItemDto) => o.permissionId)
  @ValidateNested({ each: true })
  @Type(() => UserPermissionOverrideItemDto)
  overrides!: UserPermissionOverrideItemDto[];
}

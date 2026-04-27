import { IsArray, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PermissionUpdate {
  @ApiProperty()
  @IsString()
  permissionId!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [PermissionUpdate] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionUpdate)
  updates!: PermissionUpdate[];
}

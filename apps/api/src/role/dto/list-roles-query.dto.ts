import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLE_SCOPES } from './create-role.dto';

export class ListRolesQueryDto {
  @ApiPropertyOptional({ enum: ROLE_SCOPES })
  @IsOptional()
  @IsIn(ROLE_SCOPES as unknown as string[])
  scope?: string;

  @ApiPropertyOptional({ description: 'Filter to a specific tenant (system_admin only)' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Include system roles in results (default: true)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeSystem?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  search?: string;
}

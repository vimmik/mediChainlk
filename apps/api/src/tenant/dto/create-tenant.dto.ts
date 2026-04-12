import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'ABC Pharmacy' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'abc-pharmacy', description: 'URL-safe slug, lowercase with hyphens' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens only' })
  slug!: string;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'ABC Colombo' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '123 Main Street, Colombo 03' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'Colombo' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({ example: 'Western' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ example: '+94112345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'PH-LK-2024-001', description: 'Pharmacy license number (unique per branch)' })
  @IsString()
  @IsNotEmpty()
  licenseNo!: string;
}

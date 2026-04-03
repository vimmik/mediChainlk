import { IsString, IsNotEmpty, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertInventoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pharmacyId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicineId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNo?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantityOnHand!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  reorderLevel!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

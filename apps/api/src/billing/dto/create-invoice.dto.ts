import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicineId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicineName!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pharmacyId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  prescriptionId?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;
}

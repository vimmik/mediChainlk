import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './get-quotes.dto';

export class DispatchDeliveryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ enum: ['PICKME_FLASH', 'GRASSHOPPERS', 'OWN_FLEET', 'MANUAL'] })
  @IsString()
  @IsNotEmpty()
  provider!: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  pickupAddress!: AddressDto;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  dropoffAddress!: AddressDto;
}

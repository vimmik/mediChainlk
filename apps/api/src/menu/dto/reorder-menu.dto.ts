import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'New sortOrder for this item' })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

/**
 * Reorder a set of SIBLING menu items. All entries must share the same parent —
 * the service rejects the request otherwise. This keeps reordering scoped and
 * prevents accidental cross-branch moves.
 */
export class ReorderMenuDto {
  @ApiProperty({ type: [ReorderEntryDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(200)
  @ArrayUnique((e: ReorderEntryDto) => e.id)
  @ValidateNested({ each: true })
  @Type(() => ReorderEntryDto)
  items!: ReorderEntryDto[];
}

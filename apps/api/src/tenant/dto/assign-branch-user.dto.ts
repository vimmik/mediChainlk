import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignBranchUserDto {
  @ApiProperty({ description: 'User ID (cuid) to assign to this branch' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiPropertyOptional({ description: 'Mark this as the user\'s primary branch' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

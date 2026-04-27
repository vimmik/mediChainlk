import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadPrescriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ description: 'S3 key of the uploaded prescription image' })
  @IsString()
  @IsNotEmpty()
  imageS3Key!: string;
}

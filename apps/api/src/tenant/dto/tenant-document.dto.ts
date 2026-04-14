import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

const DOCUMENT_TYPES = ['business_registration', 'pharmacy_license', 'nmra_certificate', 'tax_certificate', 'insurance', 'other'] as const;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// 20 MB max file size
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export class CreateTenantDocumentDto {
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(DOCUMENT_TYPES)
  documentType!: string;

  @ApiProperty({ example: 'Pharmacy License 2024' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title!: string;

  @ApiProperty({ example: 'https://s3.amazonaws.com/...' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  @MaxLength(2048)
  fileUrl!: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_MIME_TYPES, { message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` })
  mimeType?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateTenantDocumentDto {
  @ApiPropertyOptional({ enum: DOCUMENT_TYPES })
  @IsString()
  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  documentType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(256)
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'fileUrl must be a valid URL' })
  @MaxLength(2048)
  fileUrl?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  fileSize?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsIn(ALLOWED_MIME_TYPES, { message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}` })
  mimeType?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrescriptionService } from './prescription.service';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant, CurrentUser } from '../common/decorators/tenant.decorator';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post('upload')
  @Roles('customer')
  upload(@Body() dto: UploadPrescriptionDto, @CurrentUser() user: { uid: string }) {
    return this.prescriptionService.uploadPrescription(dto, user.uid);
  }

  @Post(':id/trigger-ocr')
  @Roles('pharmacy_staff', 'pharmacy_owner')
  triggerOcr(@Param('id') id: string) {
    return this.prescriptionService.triggerOcr(id);
  }

  @Get('review-queue')
  @Roles('pharmacy_staff', 'pharmacy_owner')
  getReviewQueue(@CurrentTenant() tenantId: string, @Query('pharmacyId') pharmacyId: string) {
    return this.prescriptionService.getPendingReviewQueue(tenantId, pharmacyId);
  }

  @Patch(':id/review')
  @Roles('pharmacy_staff', 'pharmacy_owner')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewPrescriptionDto,
    @CurrentUser() user: { uid: string },
  ) {
    return this.prescriptionService.pharmacistConfirm(id, dto, user.uid);
  }
}

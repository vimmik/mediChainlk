import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PRESCRIPTION_REPOSITORY, type IPrescriptionRepository } from './domain/repositories/prescription.repository';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY) private readonly prescriptionRepo: IPrescriptionRepository,
    private readonly configService: ConfigService,
  ) {}

  async uploadPrescription(dto: UploadPrescriptionDto, customerId: string) {
    const prescription = await this.prescriptionRepo.create({
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      customerId,
      imageS3Key: dto.imageS3Key,
      status: 'UPLOADED',
    });

    this.triggerOcr(prescription.id).catch(console.error);
    return prescription;
  }

  async triggerOcr(prescriptionId: string) {
    const prescription = await this.prescriptionRepo.findById(prescriptionId);
    if (!prescription) throw new NotFoundException('Prescription not found');

    await this.prescriptionRepo.updateStatus(prescriptionId, { status: 'OCR_PROCESSING' });

    const aiServiceUrl = this.configService.get('AI_SERVICE_URL');
    const response = await axios.post(`${aiServiceUrl}/prescriptions/analyze`, {
      prescription_id: prescriptionId,
      s3_key: prescription.imageS3Key,
      language_hints: ['en', 'si', 'ta'],
    });

    await this.prescriptionRepo.updateStatus(prescriptionId, {
      status: response.data.confidence_tier === 'HIGH' ? 'CONFIRMED' : 'PENDING_REVIEW',
      ocrRawText: response.data.raw_text,
      ocrResult: response.data,
      confidenceTier: response.data.confidence_tier,
    });

    return response.data;
  }

  async getPendingReviewQueue(tenantId: string, branchId: string) {
    return this.prescriptionRepo.findPendingReview(tenantId, branchId);
  }

  async pharmacistConfirm(id: string, dto: ReviewPrescriptionDto, reviewerUid: string) {
    return this.prescriptionRepo.updateStatus(id, {
      status: dto.approved ? 'CONFIRMED' : 'REJECTED',
      reviewedBy: reviewerUid,
      reviewedAt: new Date(),
      reviewNotes: dto.notes,
    });
  }
}

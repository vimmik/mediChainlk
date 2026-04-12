import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { UploadPrescriptionDto } from './dto/upload-prescription.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';

@Injectable()
export class PrescriptionService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async uploadPrescription(dto: UploadPrescriptionDto, customerId: string) {
    const prescription = await this.prisma.prescription.create({
      data: {
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        customerId,
        imageS3Key: dto.imageS3Key,
        status: 'UPLOADED',
      },
    });

    // Trigger OCR asynchronously
    this.triggerOcr(prescription.id).catch(console.error);

    return prescription;
  }

  async triggerOcr(prescriptionId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
    if (!prescription) throw new NotFoundException('Prescription not found');

    await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'OCR_PROCESSING' },
    });

    const aiServiceUrl = this.configService.get('AI_SERVICE_URL');
    const response = await axios.post(`${aiServiceUrl}/prescriptions/analyze`, {
      prescription_id: prescriptionId,
      s3_key: prescription.imageS3Key,
      language_hints: ['en', 'si', 'ta'],
    });

    await this.prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: response.data.confidence_tier === 'HIGH' ? 'CONFIRMED' : 'PENDING_REVIEW',
        ocrRawText: response.data.raw_text,
        ocrResult: response.data,
        confidenceTier: response.data.confidence_tier,
      },
    });

    return response.data;
  }

  async getPendingReviewQueue(tenantId: string, branchId: string) {
    return this.prisma.prescription.findMany({
      where: {
        tenantId,
        branchId,
        status: { in: ['PENDING_REVIEW', 'PHARMACIST_REVIEWING'] },
      },
      include: { customer: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async pharmacistConfirm(id: string, dto: ReviewPrescriptionDto, reviewerUid: string) {
    return this.prisma.prescription.update({
      where: { id },
      data: {
        status: dto.approved ? 'CONFIRMED' : 'REJECTED',
        reviewedBy: reviewerUid,
        reviewedAt: new Date(),
        reviewNotes: dto.notes,
      },
    });
  }
}

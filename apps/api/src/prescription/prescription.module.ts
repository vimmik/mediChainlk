import { Module } from '@nestjs/common';
import { PRESCRIPTION_REPOSITORY } from './domain/repositories/prescription.repository';
import { PrismaPrescriptionRepository } from './infrastructure/prisma-prescription.repository';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';

@Module({
  controllers: [PrescriptionController],
  providers: [
    { provide: PRESCRIPTION_REPOSITORY, useClass: PrismaPrescriptionRepository },
    PrescriptionService,
  ],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}

export type PrescriptionStatus =
  | 'UPLOADED'
  | 'OCR_PROCESSING'
  | 'PENDING_REVIEW'
  | 'PHARMACIST_REVIEWING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'BILLED';

export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedMedicine {
  rawText: string;
  drugName: string | null;
  dosage: string | null;
  strength: string | null;
  form: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  confidence: number;
  matchedFormularyId: string | null;
}

export interface PrescriptionOcrResult {
  prescriptionId: string;
  rawText: string;
  language: 'en' | 'si' | 'ta' | 'mixed';
  overallConfidence: number;
  confidenceTier: ConfidenceTier;
  extractedMedicines: ExtractedMedicine[];
  processedAt: string;
}

import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

interface UploadResult {
  prescriptionId: string;
  status: string;
}

export function usePrescriptionUpload() {
  return useMutation<UploadResult, Error, { imageUri: string; pharmacyId: string }>({
    mutationFn: async ({ imageUri, pharmacyId }) => {
      // 1. Get presigned S3 upload URL from API
      const { data: presigned } = await api.post('/prescriptions/upload-url', { pharmacyId });

      // 2. Upload image directly to S3
      const imageData = await fetch(imageUri);
      const blob = await imageData.blob();
      await fetch(presigned.data.uploadUrl, { method: 'PUT', body: blob });

      // 3. Notify API to process the uploaded prescription
      const { data: result } = await api.post('/prescriptions/upload', {
        pharmacyId,
        imageS3Key: presigned.data.s3Key,
        tenantId: presigned.data.tenantId,
      });

      return result.data;
    },
  });
}

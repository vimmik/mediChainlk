import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function usePrescriptionQueue() {
  const { pharmacyId } = useAuthStore();

  return useQuery({
    queryKey: ['prescriptions', 'queue', pharmacyId],
    queryFn: async () => {
      const res = await api.get('/prescriptions/review-queue', {
        params: { pharmacyId },
      });
      return res.data.data;
    },
    enabled: !!pharmacyId,
    refetchInterval: 30 * 1000, // poll every 30s
  });
}

export function useReviewPrescription(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { approved: boolean; notes?: string }) =>
      api.patch(`/prescriptions/${id}/review`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescriptions'] }),
  });
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useReviewPrescription } from '@/hooks/usePrescriptionQueue';
import { ConfidenceBadge } from '@/components/prescription/ConfidenceBadge';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Textarea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@medichainlk/ui';
import type { PrescriptionOcrResult, ExtractedMedicine } from '@medichainlk/shared-types';

export default function PrescriptionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [notes, setNotes] = useState('');

  const { data: prescription, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: async () => {
      const res = await api.get(`/prescriptions/${id}`);
      return res.data.data;
    },
  });

  const reviewMutation = useReviewPrescription(id);

  const handleDecision = async (approved: boolean) => {
    await reviewMutation.mutateAsync({ approved, notes });
    router.push('/prescriptions');
  };

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading prescription...</div>;
  }

  const ocrResult = prescription?.ocrResult as PrescriptionOcrResult | null;
  const medicines = ocrResult?.extractedMedicines ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Prescription Review</h2>
        {ocrResult?.confidenceTier && (
          <ConfidenceBadge
            tier={ocrResult.confidenceTier}
            confidence={ocrResult.overallConfidence}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Prescription image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prescription Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-md flex items-center justify-center h-96 text-muted-foreground text-sm">
              Image loaded via presigned S3 URL
            </div>
          </CardContent>
        </Card>

        {/* Right: Extracted medicines + actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Extracted Medicines</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((med: ExtractedMedicine, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{med.drugName ?? '—'}</TableCell>
                      <TableCell>{med.dosage ?? '—'}</TableCell>
                      <TableCell>{med.frequency ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={med.matchedFormularyId ? 'success' : 'secondary'}>
                          {med.matchedFormularyId ? 'Matched' : 'Unmatched'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {medicines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No medicines extracted
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Textarea
              placeholder="Review notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => handleDecision(true)}
              disabled={reviewMutation.isPending}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => handleDecision(false)}
              disabled={reviewMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { usePrescriptionQueue } from '@/hooks/usePrescriptionQueue';
import { Badge, Button, Skeleton } from '@medichainlk/ui';
import Link from 'next/link';
import type { ConfidenceTier } from '@medichainlk/shared-types';

const tierVariant: Record<ConfidenceTier, 'success' | 'warning' | 'destructive'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'destructive',
};

interface Prescription {
  id: string;
  confidenceTier: ConfidenceTier | null;
  status: string;
  createdAt: string;
  customer: { firstName: string | null; lastName: string | null; phone: string | null };
}

export default function PrescriptionsPage() {
  const { data: prescriptions, isLoading } = usePrescriptionQueue();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review Queue</h2>
        <p className="text-muted-foreground">Prescriptions awaiting pharmacist review</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(prescriptions as Prescription[] ?? []).map((rx) => (
            <div
              key={rx.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border"
            >
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {rx.customer.firstName} {rx.customer.lastName ?? rx.customer.phone}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(rx.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {rx.confidenceTier && (
                  <Badge variant={tierVariant[rx.confidenceTier]}>
                    {rx.confidenceTier}
                  </Badge>
                )}
                <Link href={`/prescriptions/${rx.id}/review`}>
                  <Button size="sm">Review</Button>
                </Link>
              </div>
            </div>
          ))}
          {!prescriptions?.length && (
            <p className="text-center py-12 text-muted-foreground">No prescriptions in queue.</p>
          )}
        </div>
      )}
    </div>
  );
}

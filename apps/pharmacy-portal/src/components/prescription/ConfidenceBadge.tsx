import { Badge } from '@medichainlk/ui';
import type { ConfidenceTier } from '@medichainlk/shared-types';

interface ConfidenceBadgeProps {
  tier: ConfidenceTier;
  confidence?: number;
}

const tierConfig: Record<ConfidenceTier, { variant: 'success' | 'warning' | 'destructive'; label: string }> = {
  HIGH: { variant: 'success', label: 'High Confidence' },
  MEDIUM: { variant: 'warning', label: 'Medium — Review Required' },
  LOW: { variant: 'destructive', label: 'Low — Manual Entry Required' },
};

export function ConfidenceBadge({ tier, confidence }: ConfidenceBadgeProps) {
  const config = tierConfig[tier];
  return (
    <Badge variant={config.variant}>
      {config.label}
      {confidence !== undefined && ` (${Math.round(confidence * 100)}%)`}
    </Badge>
  );
}

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return `LKR ${amount.toLocaleString('en-LK')}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
}

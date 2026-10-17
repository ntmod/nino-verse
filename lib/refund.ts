import { moneyCents } from './money-cents.mjs';

export interface RefundRecord { requestId: string; amountCents: number; createdAt: string; kind: 'refund' | 'cancel' }
export function refundPlan(record: { amount: number; refunds?: RefundRecord[] }, input: { requestId?: unknown; amount?: unknown; kind?: unknown }) {
  if (typeof input.requestId !== 'string' || !/^[\w-]{8,80}$/.test(input.requestId) || !['refund', 'cancel'].includes(String(input.kind))) throw Error('Invalid refund');
  const prior = record.refunds?.find(item => item.requestId === input.requestId);
  const amountCents = input.kind === 'cancel' ? (prior?.amountCents ?? Math.round(-record.amount * 100)) : moneyCents(input.amount);
  if (prior) {
    if (prior.kind !== input.kind || prior.amountCents !== amountCents) throw Error('Request ID already used');
    return { duplicate: true, amountCents, nextAmount: record.amount };
  }
  const remaining = Math.round(-record.amount * 100);
  if (!Number.isSafeInteger(remaining) || remaining <= 0 || amountCents <= 0 || amountCents > remaining) throw Error('Refund exceeds remaining expense');
  return { duplicate: false, amountCents, nextAmount: (amountCents - remaining) / 100 };
}

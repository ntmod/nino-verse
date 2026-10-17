import type { CycleChange, CycleState } from '@/lib/cycle-config';
import type { CycleImpact } from '@/lib/cycle-impact';
export interface CyclePreview { impact: CycleImpact; previewHash: string; state: CycleState }
async function request<T>(body?: object): Promise<T> {
  const response = await fetch('/api/nori/cycle', body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Cycle request failed'); }
  return response.json();
}
export const cycleService = {
  get: () => request<CycleState>(),
  preview: (change: CycleChange, revision: number) => request<CyclePreview>({ ...change, revision }),
  confirm: (change: CycleChange, revision: number, previewHash: string) => request<CycleState>({ ...change, revision, previewHash, confirm: true }),
};

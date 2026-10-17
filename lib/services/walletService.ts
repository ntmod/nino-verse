import { cachedMetadata, clearMetadataCache } from '@/lib/metadata-cache';
import type { BudgetWallet, WalletSnapshot } from '@/lib/wallet-budget';

async function walletRequest<T>(path = '', method = 'GET', body?: object): Promise<T> {
  const invalidates = method !== 'GET' && path !== '/transfer';
  if (invalidates) clearMetadataCache();
  const response = await fetch(`/api/nori/wallet${path}`, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Wallet request failed');
  }
  if (invalidates) clearMetadataCache();
  return response.json();
}
export const walletService = {
  getChoices: (userId?: string) => userId ? cachedMetadata(`wallet:${userId}`, () => walletRequest<BudgetWallet[]>('?choices=1')) : walletRequest<BudgetWallet[]>('?choices=1'),
  getAll: (startDate?: string, endDate?: string) => walletRequest<WalletSnapshot>(startDate && endDate ? `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}` : ''),
  archive: (id: string, archived: boolean) => walletRequest(`/${id}`, 'PATCH', { archived }),
  create: (body: { name: string; budget: string }) => walletRequest('', 'POST', body),
  update: (id: string, body: { name: string; budget: string }) => walletRequest(`/${id}`, 'PATCH', body),
  transfer: (body: { fromWalletId: string; toWalletId: string; amount: string; requestId: string }) => walletRequest('/transfer', 'POST', body),
};

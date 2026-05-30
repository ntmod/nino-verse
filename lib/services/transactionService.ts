import { Transaction } from "@/lib/types";

export const transactionService = {
  async getAll(startDate?: string, endDate?: string): Promise<Transaction[]> {
    let url = '/api/nori/transaction';
    if (startDate && endDate) {
      url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async create(data: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch('/api/nori/transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transaction');
    return res.json();
  },

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`/api/nori/transaction/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transaction');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/nori/transaction/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transaction');
  },
};

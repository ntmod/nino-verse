import { cachedMetadata, clearMetadataCache } from "@/lib/metadata-cache";

export const paymentService = {
  async getAll(userId?: string): Promise<any[]> {
    const load = async () => {
      const res = await fetch('/api/nori/method');
      if (!res.ok) throw new Error('Failed to fetch payment methods');
      return res.json();
    };
    return userId ? cachedMetadata(`payment:${userId}`, load) : load();
  },

  async create(data: any): Promise<any> {
    clearMetadataCache();
    const res = await fetch('/api/nori/method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create payment method');
    clearMetadataCache();
    return res.json();
  },

  async update(id: string, data: any): Promise<any> {
    clearMetadataCache();
    const res = await fetch(`/api/nori/method/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update payment method');
    clearMetadataCache();
    return res.json();
  },

  async delete(id: string): Promise<void> {
    clearMetadataCache();
    const res = await fetch(`/api/nori/method/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete payment method');
    clearMetadataCache();
  },
};

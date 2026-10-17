import { cachedMetadata, clearMetadataCache } from "@/lib/metadata-cache";

export const categoryService = {
  async getAll(userId?: string): Promise<any[]> {
    const load = async () => {
      const res = await fetch('/api/nori/category');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    };
    return userId ? cachedMetadata(`category:${userId}`, load) : load();
  },

  async create(data: any): Promise<any> {
    clearMetadataCache();
    const res = await fetch('/api/nori/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create category');
    clearMetadataCache();
    return res.json();
  },

  async update(id: string, data: any): Promise<any> {
    clearMetadataCache();
    const res = await fetch(`/api/nori/category/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    clearMetadataCache();
    return res.json();
  },

  async delete(id: string): Promise<void> {
    clearMetadataCache();
    const res = await fetch(`/api/nori/category/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
    clearMetadataCache();
  },

  async updateOrder(data: { id: string, order: number }[]): Promise<void> {
    clearMetadataCache();
    const res = await fetch('/api/nori/category', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category order');
    clearMetadataCache();
  }
};

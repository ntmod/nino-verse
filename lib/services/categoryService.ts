export const categoryService = {
  async getAll(): Promise<any[]> {
    const res = await fetch('/api/nori/category');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async create(data: any): Promise<any> {
    const res = await fetch('/api/nori/category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async update(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/nori/category/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/nori/category/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async updateOrder(data: { id: string, order: number }[]): Promise<void> {
    const res = await fetch('/api/nori/category', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category order');
  }
};

export const paymentService = {
  async getAll(): Promise<any[]> {
    const res = await fetch('/api/nori/method');
    if (!res.ok) throw new Error('Failed to fetch payment methods');
    return res.json();
  },

  async create(data: any): Promise<any> {
    const res = await fetch('/api/nori/method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create payment method');
    return res.json();
  },

  async update(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/nori/method/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update payment method');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/nori/method/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete payment method');
  },
};

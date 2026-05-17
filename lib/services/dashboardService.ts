export const budgetService = {
  async getAll(): Promise<any[]> {
    const res = await fetch('/api/nori/budget');
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },
};

export const fixedCostService = {
  async getAll(): Promise<any[]> {
    const res = await fetch('/api/nori/fixed-cost');
    if (!res.ok) throw new Error('Failed to fetch fixed costs');
    return res.json();
  },
};

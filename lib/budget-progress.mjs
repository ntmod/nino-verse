/** Resolve legacy names and IDs, then sum only recorded expenses in cents. */
export function budgetProgress(budgets, categories, transactions) {
  const aliases = new Map();
  for (const category of categories) {
    aliases.set(category._id, category._id);
    aliases.set(category.name, category._id);
  }
  const spending = new Map();
  for (const transaction of transactions) {
    if (!Number.isFinite(transaction.amount) || transaction.amount >= 0) continue;
    const key = aliases.get(transaction.category) ?? transaction.category;
    spending.set(key, (spending.get(key) ?? 0) + Math.round(-transaction.amount * 100));
  }
  return budgets.map(budget => ({
    ...budget,
    category: categories.find(category => category._id === budget.category || category.name === budget.category)?.name ?? budget.category,
    spent: (spending.get(aliases.get(budget.category) ?? budget.category) ?? 0) / 100,
  }));
}

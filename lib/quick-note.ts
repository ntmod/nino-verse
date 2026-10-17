export interface QuickCategory {
  _id: string;
  name: string;
  icon?: string;
  defaultWalletId?: string;
  type: 'income' | 'expense';
  subcategories?: { _id: string; name: string }[];
}

export interface QuickPayment {
  _id: string;
  name: string;
}

export function localRecordDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function quickNoteData(
  input: { name: string; amount: string; category: string; paymentMethod: string; subCategory: string; date?: string; walletId?: string },
  categories: QuickCategory[],
  methods: QuickPayment[],
) {
  const category = categories.find(item => item._id === input.category);
  const cents = Math.round(Number(input.amount) * 100);
  if (!/^\d+(?:\.\d{1,2})?$/.test(input.amount) || cents <= 0 || !Number.isSafeInteger(cents)) throw new Error('Invalid amount');
  if (!category || !methods.some(item => item._id === input.paymentMethod)) throw new Error('Invalid category or payment method');
  if (input.subCategory && !category.subcategories?.some(item => item._id === input.subCategory)) throw new Error('Invalid subcategory');
  const date = input.date ?? localRecordDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Invalid date');
  if (input.name.trim().length > 200) throw new Error('Description too long');
  return {
    name: input.name.trim() || category.name,
    amount: (category.type === 'income' ? cents : -cents) / 100,
    category: category._id,
    subCategory: input.subCategory,
    paymentMethod: input.paymentMethod,
    date,
    ...(input.walletId !== undefined ? { walletId: input.walletId } : {}),
  };
}

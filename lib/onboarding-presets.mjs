import { moneyCents } from './money-cents.mjs';

export const ONBOARDING_CATEGORIES = [
  { key: 'food', th: 'อาหาร', en: 'Food', icon: '🍙' },
  { key: 'travel', th: 'เดินทาง', en: 'Travel', icon: '🚗' },
  { key: 'shopping', th: 'ช้อปปิ้ง', en: 'Shopping', icon: '🛍️' },
  { key: 'bills', th: 'บิลและค่าสมาชิก', en: 'Bills', icon: '🧾' },
  { key: 'health', th: 'สุขภาพ', en: 'Health', icon: '🩹' },
  { key: 'other', th: 'อื่น ๆ', en: 'Other', icon: '🏷️' },
];

export function onboardingPlan(body) {
  if (!body || !['th', 'en'].includes(body.language) || !Array.isArray(body.categories) || !body.categories.length ||
      body.categories.some(key => !ONBOARDING_CATEGORIES.some(category => category.key === key))) throw new Error('Select at least one category');
  if (typeof body.walletName !== 'string' || !body.walletName.trim() || body.walletName.trim().length > 80) throw new Error('Enter a payment method name');
  const cycle = body.cycle ?? { mode: 'fixed', fixedDay: 30 };
  if (!cycle || !['fixed','manual'].includes(cycle.mode) || (cycle.mode === 'fixed' && (!Number.isInteger(cycle.fixedDay) || cycle.fixedDay < 1 || cycle.fixedDay > 31))) throw new Error('Invalid cycle');
  if (cycle.mode === 'manual' && typeof cycle.startDate !== 'string') throw new Error('Choose a cycle start');
  const drafts = body.budgetWallets ?? [];
  if (!Array.isArray(drafts) || drafts.length > 20) throw new Error('Invalid budget wallets');
  const budgetWallets = drafts.map(wallet => {
    if (!wallet || typeof wallet.name !== 'string' || !wallet.name.trim() || wallet.name.trim().length > 80) throw new Error('Enter a budget wallet name');
    return { name: wallet.name.trim(), budgetCents: moneyCents(wallet.budget, true) };
  });
  return {
    categories: [...new Set(body.categories)].map(key => {
      const category = ONBOARDING_CATEGORIES.find(item => item.key === key);
      return { name: category[body.language], icon: category.icon, type: 'expense' };
    }).concat([{ name: body.language === 'th' ? 'รายรับ' : 'Income', icon: '💰', type: 'income' }]),
    cycle, budgetWallets,
    wallet: { name: body.walletName.trim(), icon: '👛', color: '#508069' },
  };
}

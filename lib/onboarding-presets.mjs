import { validInitialBalance } from './payment-balance.mjs';

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
  if (typeof body.walletName !== 'string' || !body.walletName.trim() || body.walletName.trim().length > 80) throw new Error('Enter a wallet name');
  if (!validInitialBalance(body.initialBalance)) throw new Error('Enter a valid initial balance');
  return {
    categories: [...new Set(body.categories)].map(key => {
      const category = ONBOARDING_CATEGORIES.find(item => item.key === key);
      return { name: category[body.language], icon: category.icon, type: 'expense' };
    }).concat([{ name: body.language === 'th' ? 'รายรับ' : 'Income', icon: '💰', type: 'income' }]),
    wallet: { name: body.walletName.trim(), icon: '👛', color: '#508069', initialBalance: body.initialBalance == null ? null : Math.round(body.initialBalance * 100) / 100 },
  };
}

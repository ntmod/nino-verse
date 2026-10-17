import { cycleDays, getSpendingCycle } from '@/lib/spending-cycle.js';

export const demoCategories = [
  { id: 'food', name: 'อาหารและเครื่องดื่ม', en: 'Food & drinks', icon: '🍙', color: '#7f9b83', tint: '#e8eee5', limit: 5000 },
  { id: 'travel', name: 'เดินทาง', en: 'Getting around', icon: '🚃', color: '#839aaf', tint: '#e8edf1', limit: 2500 },
  { id: 'home', name: 'ของใช้และบ้าน', en: 'Home & essentials', icon: '🧺', color: '#c49a72', tint: '#f4ece0', limit: 4000 },
  { id: 'joy', name: 'ความสุขเล็ก ๆ', en: 'Little joys', icon: '☕', color: '#b38b99', tint: '#f2e8ec', limit: 2000 },
];

export function dashboardSample(offset: number, fullCycle = false) {
  const cycle = getSpendingCycle(offset, new Date('2026-10-17T12:00:00+07:00'));
  const records = Array.from({ length: fullCycle ? cycleDays(cycle) : 18 }, (_, day) => {
    const date = new Date(cycle.startDate.getTime() + day * 86_400_000 + 43_200_000).toISOString();
    return [
      { category: 'food', name: ['ข้าวกลางวัน', 'ข้าวเย็นร้านประจำ', 'ก๋วยเตี๋ยวและน้ำ'][day % 3], en: ['Lunch', 'Dinner at our usual spot', 'Noodles & a drink'][day % 3], amount: 70 + (day * 13 % 110) },
      { category: 'travel', name: day % 2 ? 'รถไฟฟ้ากลับบ้าน' : 'เดินทางไปทำงาน', en: day % 2 ? 'Train ride home' : 'Morning commute', amount: 35 + day * 7 % 60 },
      { category: day % 3 ? 'joy' : 'home', name: day % 3 ? 'กาแฟระหว่างทาง' : 'ของใช้เข้าบ้าน', en: day % 3 ? 'Coffee on the way' : 'Household essentials', amount: day % 3 ? 65 + day % 4 * 10 : 280 + day * 11 },
    ].map((item, index) => ({ ...item, subCategory: item.category === 'food' ? 'มื้ออาหาร' : item.category === 'travel' ? 'ขนส่งสาธารณะ' : item.category === 'joy' ? 'กาแฟ' : 'ของใช้', subEn: item.category === 'food' ? 'Meals' : item.category === 'travel' ? 'Public transport' : item.category === 'joy' ? 'Coffee' : 'Household', id: `${offset}-${day}-${index}`, amount: Math.round(item.amount * (offset % 2 ? 0.92 : 1)), day, date, payment: index === 1 ? 'cash' : 'bank' }));
  }).flat();
  const total = records.reduce((sum, record) => sum + record.amount, 0);
  const categories = demoCategories.map(category => ({ ...category, spent: records.filter(record => record.category === category.id).reduce((sum, record) => sum + record.amount, 0) }));
  const days = Array.from({ length: fullCycle ? cycleDays(cycle) : 18 }, (_, day) => ({ day, date: records.find(record => record.day === day)!.date, amount: records.filter(record => record.day === day).reduce((sum, record) => sum + record.amount, 0) }));
  return { cycle, records, total, categories, days, budget: categories.reduce((sum, category) => sum + category.limit, 0) };
}

export type DashboardSample = ReturnType<typeof dashboardSample>;
export type DemoRecord = DashboardSample['records'][number];

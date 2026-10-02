/** Build factual hints from the selected cycle's dashboard totals. */
export function getHeaderHints({ total, count, previousTotal, topCategory, bills, paidBills }, language) {
  const th = language === 'th';
  const money = value => new Intl.NumberFormat(th ? 'th-TH' : 'en-US', {
    style: 'currency', currency: 'THB', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
  }).format(value);
  const hints = [{
    text: count ? (th ? `รอบนี้จดรายจ่าย ${count} รายการ รวม ${money(total)} แล้วนะ` : `${count} expenses noted this cycle, totaling ${money(total)}.`)
      : (th ? 'รอบนี้ยังไม่มีรายจ่าย จดรายการแรกด้วยกันไหม?' : 'No expenses this cycle yet. Shall we note the first one?'),
    asset: 'cat-idle',
  }];
  if (topCategory) hints.push({
    text: th ? `${topCategory.name} เป็นหมวดที่ใช้มากที่สุดในรอบนี้ ${money(topCategory.amount)}` : `${topCategory.name} leads this cycle at ${money(topCategory.amount)}.`,
    asset: 'teftel-cat-08',
  });
  if (bills > 0) hints.push({
    text: paidBills === bills ? (th ? 'บิลรอบนี้จ่ายครบแล้ว เย้! 🐾' : 'All bills marked paid this cycle. Yay! 🐾')
      : (th ? `บิลรอบนี้จ่ายแล้ว ${paidBills} จาก ${bills} รายการ ค่อย ๆ เก็บกันนะ` : `${paidBills} of ${bills} bills marked paid. One at a time!`),
    asset: paidBills === bills ? 'teftel-cat-21' : 'teftel-cat-13',
  });
  if (previousTotal > 0 && count > 0) hints.push({
    text: th ? `รอบก่อนใช้ทั้งหมด ${money(previousTotal)} ส่วนรอบที่เลือกตอนนี้ ${money(total)} นะ` : `Previous full cycle: ${money(previousTotal)}. Selected cycle so far: ${money(total)}.`,
    asset: 'teftel-cat-13',
  });
  return hints;
}

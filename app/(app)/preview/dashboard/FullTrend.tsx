'use client';

import { useState } from 'react';
import { money, shortDate } from './ConceptParts';
import type { DemoRecord, DashboardSample } from './demo-data';

export default function FullTrend({ records, sample, previous, th }: {
  records: DemoRecord[]; sample: DashboardSample; previous: DashboardSample; th: boolean;
}) {
  const [compare, setCompare] = useState(false);
  const [day, setDay] = useState(17);
  const length = previous.days.length;
  const current: number[] = [];
  const prior: number[] = [];
  let currentSum = 0;
  let previousSum = 0;
  for (let index = 0; index < length; index++) {
    currentSum += records.filter(record => record.day === index).reduce((sum, record) => sum + Math.round(record.amount * 100), 0) / 100;
    previousSum += previous.days[index].amount;
    if (index < sample.days.length) current.push(currentSum);
    prior.push(previousSum);
  }
  const maximum = Math.max(...current, ...(compare ? prior : []), 1);
  const points = (values: number[]) => values.map((value, index) => `${36 + index / Math.max(length - 1, sample.days.length - 1) * 550},${186 - value / maximum * 150}`).join(' ');
  const daily = records.filter(record => record.day === day).reduce((sum, record) => sum + Math.round(record.amount * 100), 0) / 100;
  const x = 36 + day / Math.max(length - 1, sample.days.length - 1) * 550;
  return <>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold">{th ? 'แนวโน้มรายจ่ายสะสม' : 'Your cumulative spending'}</h2><p className="mt-1 text-xs text-[#a0a394]">{th ? 'เห็นทั้งยอดสะสมและยอดใช้ในแต่ละวัน' : 'The running total, and each day along the way'}</p></div><button type="button" aria-pressed={compare} onClick={() => setCompare(value => !value)} className={`min-h-11 rounded-[10px] border px-3 text-[11px] ${compare ? 'border-[#a7ba94] bg-[#eef3e7] text-[#6b8157]' : 'border-[#e6e7de] text-[#9ba38b]'}`}>{th ? 'เทียบรอบก่อน' : 'Compare previous'}</button></div>
    <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2"><span className="font-mono text-2xl">฿{money(current[day])}</span><span className="text-[11px] text-[#a0a394]">{shortDate(sample.days[day].date, th)} · {th ? 'รายวัน' : 'Daily'} ฿{money(daily)}</span></div>
    <svg role="img" aria-label={th ? 'กราฟรายจ่ายสะสมในรอบที่เลือก' : 'Cumulative spending in the selected cycle'} viewBox="0 0 620 220" className="mt-3 w-full">{[0,1,2,3].map(index => <g key={index}><line x1="36" x2="586" y1={36+index*50} y2={36+index*50} stroke="#edeee7" /><text x="30" y={39+index*50} textAnchor="end" fontSize="8" fill="#adb3a1">{money(maximum*(3-index)/3)}</text></g>)}{compare && <polyline points={points(prior)} fill="none" stroke="#c6c4b4" strokeWidth="2" strokeDasharray="5 5" />}<polygon points={`36,186 ${points(current)} ${36+(current.length-1)/Math.max(length-1,sample.days.length-1)*550},186`} fill="#eef3e8" /><polyline points={points(current)} fill="none" stroke="#7d987a" strokeWidth="2.5" strokeLinejoin="round" /><line x1={x} x2={x} y1="25" y2="186" stroke="#b9c8ac" strokeDasharray="3 4" /><circle cx={x} cy={186-current[day]/maximum*150} r="4.5" fill="#fffffb" stroke="#7d987a" strokeWidth="2.5" /><text x="36" y="213" fontSize="9" fill="#a9b099">{shortDate(sample.cycle.startDate.toISOString(),th)}</text><text x="586" y="213" textAnchor="end" fontSize="9" fill="#a9b099">{shortDate(sample.cycle.endDate.toISOString(),th)}</text></svg>
    <div className="flex flex-wrap gap-4 text-[10px] text-[#a0a394]"><span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-[#7d987a]" />{th ? 'รอบที่เลือก' : 'Selected cycle'}</span>{compare && <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-[#c6c4b4]" />{th ? 'รอบก่อนเต็มรอบ' : 'Previous full cycle'} · ฿{money(prior[day])} {th ? 'ณวันลำดับเดียวกัน' : 'at the same cycle day'}</span>}</div>
    <label className="mt-3 flex min-h-11 items-center gap-3 text-[11px] text-[#a0a394]">{th ? 'เลือกวัน' : 'Explore a day'}<input type="range" min={0} max={sample.days.length-1} value={day} onChange={event => setDay(Number(event.target.value))} aria-valuetext={`${shortDate(sample.days[day].date,th)} · ${money(current[day])} THB`} className="min-w-0 flex-1 accent-[#7d987a]" /></label>
  </>;
}

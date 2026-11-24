const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,find}=require('./transaction-form.test-support.cjs');
test('comparing manual cycles of different lengths keeps the previous line inside the chart',()=>{
 const h=harness('../components/nori/TotalSpentCard.tsx');
 const points=length=>Array.from({length},(_,i)=>({day:i+1,amount:(i+1)*10,dayAmount:10,dateStr:'day'}));
 const props={amount:40,percentageChange:0,dailyAverage:10,startDate:new Date('2026-10-15T00:00:00Z'),endDate:new Date('2026-10-18T23:59:59.999Z'),defaultExpanded:true,openEnded:true,cumulativeData:points(4),prevCumulativeData:points(30)};
 find(h.render(props),n=>n.type==='button'&&n.props.children==='ui_compare_last_cycle').props.onClick({stopPropagation(){}});
 const tree=h.render(props);
 const previous=find(tree,n=>n.type==='path'&&n.props.strokeDasharray==='4 4');
 const xs=[...previous.props.d.matchAll(/[ML] ([\d.]+) [\d.]+/g)].map(match=>Number(match[1]));
 assert.equal(Math.max(...xs),660);
 assert.ok(find(tree,n=>n.type==='text'&&Array.isArray(n.props.children)&&n.props.children.includes(30)));
});

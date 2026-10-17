const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const modules={};
function load(name){if(modules[name])return modules[name];const exports=modules[name]={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/${name}`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Date,Intl,require:ref=>load(ref.replace('./','')+(/\.m?js$/.test(ref)?'':'.ts'))});return exports;}
const {cycleAt,cycleState,proposeCycleChange,cycleDate,initialCycleConfig}=load('cycle-config.ts');
const {cycleImpact}=load('cycle-impact.ts');
const now=new Date('2026-10-18T12:00:00Z');
const manual={mode:'manual',revision:2,starts:[cycleDate('2026-08-01'),cycleDate('2026-09-25'),cycleDate('2026-10-15')],ids:['anchor','september','october']};
test('manual cycles remain open until payday, then close contiguously and retain stable identities',()=>{
 const state=cycleState(manual,now);assert.equal(state.cycles[2].isOpen,true);
 assert.equal(state.cycles[1].endDate,new Date(Date.parse(manual.starts[2])-1).toISOString());
 const next=proposeCycleChange(manual,{action:'start',date:'2026-10-18'},now,now);
 assert.equal(next.starts.length,4);assert.equal(next.ids[2],'october');
 assert.equal(cycleAt(next,new Date('2026-10-17T12:00:00Z')).cycleId,'october');
 assert.equal(cycleAt(next,now).startDate,cycleDate('2026-10-18'));
});
test('editing a boundary adjusts its predecessor and only counts records crossing cycles',()=>{
 const next=proposeCycleChange(manual,{action:'edit',date:'2026-10-14',boundary:manual.starts[2]},now,now);
 assert.equal(next.ids[2],'october');
 const records=[{_id:'moved',name:'Lunch',date:'2026-10-14T00:00:00Z',amount:-80,walletId:'food'},{_id:'same',name:'Lunch',date:'2026-10-16T00:00:00Z',amount:-90,walletId:'food'}];
 const transfers=[{_id:'transfer',createdAt:'2026-10-14T12:00:00Z',fromWalletId:'food',toWalletId:'travel',amountCents:5000}];
 const impact=cycleImpact(manual,next,records,transfers,[{_id:'food',name:'Meals',budgetCents:100000},{_id:'travel',name:'Travel',budgetCents:100000}]);
 assert.equal(impact.recordsMoved,1);assert.equal(impact.transfersMoved,1);
 const food=impact.walletChanges.find(row=>row.walletName==='Meals'&&row.cycleKey===cycleDate('2026-10-14'));
 assert.equal(food.beforeCents,91000);assert.equal(food.afterCents,78000);
 assert.equal(cycleState(next,now).cycles[1].endDate,'2026-10-13T16:59:59.999Z');
});
test('invalid, overlapping, future and anchor edits are rejected',()=>{
 for(const date of ['2026-02-30','2026-10-19','2026-09-25'])assert.throws(()=>proposeCycleChange(manual,{action:'edit',date,boundary:manual.starts[2]},now,now));
 assert.throws(()=>proposeCycleChange(manual,{action:'start',date:'2026-10-15'},now,now));
 assert.throws(()=>proposeCycleChange(manual,{action:'edit',date:'2026-08-02',boundary:manual.starts[0]},now,now));
});
test('activation freezes past boundaries, handles February without loops and preserves unchanged record identities',()=>{
 const fixed={mode:'fixed',starts:[],revision:0};
 const next=proposeCycleChange(fixed,{action:'activate',date:'2026-09-30'},new Date('2026-01-15'),now);
 assert.ok(next.starts.length>8);assert.ok(next.starts.every((start,index)=>!index||start>next.starts[index-1]));
 const impact=cycleImpact(fixed,next,[{_id:'same',date:'2026-10-10',name:'Lunch',amount:-20},{_id:'feb',date:'2026-02-28',name:'Lunch',amount:-20}],[],[]);
 assert.equal(impact.recordsMoved,0);
});


test('recurring day settings preserve existing starts and generate new cycles on the chosen day',()=>{
 const fixed=proposeCycleChange(manual,{action:'configure',mode:'fixed',fixedDay:25,date:'2026-10-18'},now,now);
 assert.equal(fixed.starts[2],manual.starts[2]);
 assert.equal(cycleAt(fixed,now).startDate,manual.starts[2]);
 assert.equal(cycleAt(fixed,now).endDate,'2026-10-24T16:59:59.999Z');
 const november=cycleAt(fixed,new Date('2026-11-01T12:00:00Z'));
 assert.equal(november.startDate,cycleDate('2026-10-25'));
 assert.equal(november.endDate,'2026-11-24T16:59:59.999Z');
 const back=proposeCycleChange(fixed,{action:'configure',mode:'manual',date:'2026-11-01',fixedDay:0},now,new Date('2026-11-01T12:00:00Z'));
 assert.equal(cycleAt(back,new Date('2026-11-01T12:00:00Z')).cycleId,november.cycleId);
 assert.equal(back.fixedDay,25);
 assert.equal(cycleAt(back,new Date('2026-11-15T12:00:00Z')).isOpen,true);
 assert.equal(cycleAt(back,new Date('2026-11-15T12:00:00Z')).startDate,november.startDate);
});
test('recurring days clamp to short months without overlaps and validate 1–31',()=>{
 const fixed=proposeCycleChange(manual,{action:'configure',mode:'fixed',fixedDay:31,date:'2026-10-18'},now,now);
 const feb=cycleAt(fixed,new Date('2027-02-28T12:00:00Z'));
 assert.equal(feb.startDate,cycleDate('2027-02-28'));
 assert.equal(feb.endDate,'2027-03-30T16:59:59.999Z');
 const prior=cycleAt(fixed,new Date('2027-02-27T12:00:00Z'));
 assert.equal(Date.parse(prior.endDate)+1,Date.parse(feb.startDate));
 for(const fixedDay of [0,32,1.5,NaN])assert.throws(()=>proposeCycleChange(manual,{action:'configure',mode:'fixed',fixedDay,date:'2026-10-18'},now,now));
 const custom=proposeCycleChange({mode:'fixed',starts:[],revision:0},{action:'configure',mode:'fixed',fixedDay:25,date:'2026-10-18'},new Date('2026-01-15'),now);
 assert.equal(custom.starts.at(-1),cycleDate('2026-09-30'));
 assert.equal(cycleAt(custom,now).endDate,'2026-10-24T16:59:59.999Z');
});


test('first-time cycle setup starts on the selected day instead of preserving the legacy 30th',()=>{
 const fixed=initialCycleConfig('fixed',25,undefined,now);
 assert.equal(cycleAt(fixed,now).startDate,cycleDate('2026-09-25'));
 assert.equal(cycleAt(fixed,now).endDate,'2026-10-24T16:59:59.999Z');
 const custom=initialCycleConfig('manual',30,'2026-10-01',now);
 assert.equal(cycleAt(custom,now).startDate,cycleDate('2026-10-01'));assert.equal(cycleAt(custom,now).isOpen,true);
 assert.throws(()=>initialCycleConfig('manual',30,'2026-10-19',now));
 const feb=initialCycleConfig('fixed',31,undefined,new Date('2027-02-28T12:00:00Z'));
 assert.equal(cycleAt(feb,new Date('2027-02-28T12:00:00Z')).startDate,cycleDate('2027-02-28'));
});

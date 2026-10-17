const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/fixed-cost-status.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const {isFixedCostPaid}=context.exports;
test('fixed cost status matches Dashboard names, cycle bounds and manual reset cutoff',()=>{
 const cycle={startDate:new Date('2026-09-29T17:00:00Z'),endDate:new Date('2026-10-29T16:59:59.999Z')};
 const tx=(name,date)=>({name,date});
 assert.equal(isFixedCostPaid('Rent',[tx('RENT','2026-10-01')],cycle),true);
 assert.equal(isFixedCostPaid('Rent',[tx('Rent','2026-09-29')],cycle),false);
 assert.equal(isFixedCostPaid('Rent',[tx('Rent','2026-10-30')],cycle),false);
 assert.equal(isFixedCostPaid('Rent',[tx('Other','2026-10-01')],cycle),false);
 assert.equal(isFixedCostPaid('Rent',[tx('Rent','2026-10-01')],cycle,new Date('2026-10-02').getTime()),false);
 assert.equal(isFixedCostPaid('Rent',[tx('Rent','2026-10-03')],cycle,new Date('2026-10-02').getTime()),true);
});

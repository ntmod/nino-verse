const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const context={exports:{},require};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/wallet-budget.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
const {moneyCents,walletSummaries}=context.exports;
test('wallets count assigned expenses only, ignore income, and preserve total allocation on transfer',()=>{
 const wallets=[{_id:'food',name:'Meals',budgetCents:500000},{_id:'travel',name:'Travel',budgetCents:200000}];
 const records=[{walletId:'food',amount:-80.25},{walletId:'food',amount:1000},{amount:-300},{walletId:'travel',amount:-100}];
 const result=walletSummaries(wallets,records,[{fromWalletId:'travel',toWalletId:'food',amountCents:50000}]);
 assert.equal(result[0].spentCents,8025);assert.equal(result[0].remainingCents,541975);
 assert.equal(result[1].remainingCents,140000);
 assert.equal(result.reduce((sum,w)=>sum+w.allocatedCents,0),700000);
 const nextCycle=walletSummaries(wallets,[],[]);
 assert.equal(nextCycle[0].remainingCents,500000);assert.equal(nextCycle[1].remainingCents,200000);
 const over=walletSummaries(wallets,[{walletId:'food',amount:-6000}],[]);
 assert.equal(over[0].remainingCents,-100000,'Over-budget expenses remain visible instead of being dropped');
});
test('wallet amounts validate decimal money and safe cents',()=>{
 assert.equal(moneyCents('0',true),0);assert.equal(moneyCents('0.29'),29);assert.equal(moneyCents('5000.50'),500050);
 for(const value of [0,'0','-1','1e3','1.001','NaN',null,'9007199254740992'])assert.throws(()=>moneyCents(value));
});

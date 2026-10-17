const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {NextResponse}=require('next/server');
const now='2026-10-18T12:00:00Z';
class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return Date.parse(now);}}
function fixture(){
 let user={id:'alice',scope:{userId:'alice'}};
 const settings=[];
 const records=[{_id:'own',userId:'alice',name:'Lunch',date:new Date('2026-10-17'),amount:-80,walletId:'meals'},{_id:'foreign',userId:'bob',name:'Secret',date:new Date('2026-10-17'),amount:-9000}];
 const transfers=[{_id:'move',userId:'alice',createdAt:new Date('2026-10-17T10:00:00Z'),fromWalletId:'travel',toWalletId:'meals',amountCents:10000}];
 const wallets=[{_id:'meals',userId:'alice',name:'Meals',budgetCents:500000},{_id:'travel',userId:'alice',name:'Travel',budgetCents:200000}];
 const match=(row,query)=>Object.entries(query).every(([key,value])=>row[key]===value);
 const chain=value=>({session(){return this;},lean(){return this;},sort(){return this;},then(yes,no){return Promise.resolve(value).then(yes,no);}});
 const models={
  CycleSettings:{findOne:query=>chain(settings.find(row=>match(row,query))??null),async findOneAndUpdate(query,update){let row=settings.find(item=>match(item,query));if(!row){if(settings.some(item=>item.userId===query.userId))throw Object.assign(Error('duplicate'),{code:11000});row={userId:query.userId};settings.push(row);}Object.assign(row,update.$set);row.starts=row.starts.map(date=>new Date(date));if(row.automaticFrom)row.automaticFrom=new Date(row.automaticFrom);return row;}},
  Transaction:{find:query=>chain(records.filter(row=>match(row,query)))},WalletTransfer:{find:query=>chain(transfers.filter(row=>match(row,query)))},Wallet:{find:query=>chain(wallets.filter(row=>match(row,query)))},
 };
 const modules={};
 function load(file){if(modules[file])return modules[file];const exports=modules[file]={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/../${file}`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,Date:ClockDate,Intl,Response,console,require:name=>{
  if(name==='server-only')return{};
  if(name==='node:crypto')return require(name);
  if(name==='next/server')return{NextResponse};
  if(name==='@/lib/db')return{default:async()=>{},__esModule:true};
  if(name==='@/lib/current-user')return{requireUser:async()=>user??NextResponse.json({error:'Unauthorized'},{status:401})};
  if(name.startsWith('@/models/'))return{default:models[name.split('/').pop()],__esModule:true};
  if(name.startsWith('@/lib/'))return load(name.replace('@/','')+'.ts');
  if(name==='./spending-cycle.js')return load('lib/spending-cycle.js');
  if(name.startsWith('./'))return load('lib/'+name.slice(2)+(/\.m?js$/.test(name)?'':'.ts'));
  throw Error(name);
 }});return exports;}
 const route=load('app/api/nori/cycle/route.ts');
 const request=body=>new Request('http://localhost/api/nori/cycle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 return{route,request,settings,records,transfers,user:value=>{user=value;}};
}
test('cycle preview is read-only; confirmed changes are scoped and persisted with stable boundaries',async()=>{
 const f=fixture();
 assert.equal((await(await f.route.GET()).json()).config.mode,'fixed');
 const change={action:'activate',date:'2026-09-30',revision:0};
 let response=await f.route.POST(f.request(change));assert.equal(response.status,200);
 const preview=await response.json();assert.equal(f.settings.length,0);
 response=await f.route.POST(f.request({...change,confirm:true,previewHash:preview.previewHash,userId:'bob'}));
 assert.equal(response.status,200);assert.equal(f.settings[0].userId,'alice');
 const state=await response.json();assert.equal(state.config.mode,'manual');assert.equal(state.cycles.at(-1).isOpen,true);
 const start={action:'start',date:'2026-10-17',revision:1};
 const impact=await(await f.route.POST(f.request(start))).json();
 assert.equal(impact.impact.recordsMoved,1,'Foreign records cannot enter the preview');assert.equal(impact.impact.transfersMoved,1);
 assert.equal((await f.route.POST(f.request({...start,confirm:true,previewHash:impact.previewHash}))).status,200);
 const next=await(await f.route.GET()).json();assert.equal(next.cycles.at(-2).endDate,'2026-10-16T16:59:59.999Z');
 assert.equal(next.cycles.at(-1).startDate,'2026-10-16T17:00:00.000Z');
 assert.equal(f.records[0].date.toISOString(),'2026-10-17T00:00:00.000Z','Records retain their dates');
 assert.equal(f.transfers[0].amountCents,10000,'Budget transfers are never rewritten');
});
test('stale previews and stale config revisions cannot commit',async()=>{
 const f=fixture();const change={action:'activate',date:'2026-09-30',revision:0};
 const preview=await(await f.route.POST(f.request(change))).json();
 f.records[0].amount=-81;
 assert.equal((await f.route.POST(f.request({...change,confirm:true,previewHash:preview.previewHash}))).status,409);
 assert.equal(f.settings.length,0);
 const fresh=await(await f.route.POST(f.request(change))).json();
 assert.equal((await f.route.POST(f.request({...change,confirm:true,previewHash:fresh.previewHash}))).status,200);
 assert.equal((await f.route.POST(f.request({...change,confirm:true,previewHash:fresh.previewHash}))).status,409);
});
test('cycle APIs require authentication and validate dates',async()=>{
 const f=fixture();
 assert.equal((await f.route.POST(f.request({action:'activate',date:'2026-02-30',revision:0}))).status,400);
 assert.equal((await f.route.POST(f.request({action:'activate',date:'2026-10-19',revision:0}))).status,400);
 f.user(null);assert.equal((await f.route.GET()).status,401);
 assert.equal((await f.route.POST(f.request({action:'activate',date:'2026-10-18',revision:0}))).status,401);
});


test('two-way settings persist the recurring day and retain historical starts when returning to custom mode',async()=>{
 const f=fixture();
 const change={action:'configure',mode:'fixed',fixedDay:25,date:'2026-10-18',revision:0};
 let preview=await(await f.route.POST(f.request(change))).json();
 assert.equal((await f.route.POST(f.request({...change,confirm:true,previewHash:preview.previewHash}))).status,200);
 let state=await(await f.route.GET()).json();
 assert.equal(state.config.fixedDay,25);assert.equal(state.config.mode,'fixed');
 assert.equal(state.cycles.at(-1).endDate,'2026-10-24T16:59:59.999Z');
 const starts=[...state.config.starts];
 const custom={action:'configure',mode:'manual',date:'2026-10-18',revision:1};
 preview=await(await f.route.POST(f.request(custom))).json();
 assert.equal((await f.route.POST(f.request({...custom,confirm:true,previewHash:preview.previewHash}))).status,200);
 state=await(await f.route.GET()).json();assert.equal(state.config.mode,'manual');
 assert.deepEqual(state.config.starts,starts);assert.equal(state.cycles.at(-1).isOpen,true);
});

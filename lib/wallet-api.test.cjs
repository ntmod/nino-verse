const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {NextResponse}=require('next/server');
const a='aaaaaaaaaaaaaaaaaaaaaaaa',b='bbbbbbbbbbbbbbbbbbbbbbbb',c='cccccccccccccccccccccccc';
function fixture(){
 let owner={id:'alice',scope:{userId:'alice'}};
 let cycle={startDate:new Date('2026-09-29T17:00:00Z'),endDate:new Date('2026-10-29T16:59:59.999Z')};
 const records={Wallet:[{_id:a,userId:'alice',name:'Food',budgetCents:100000,revision:0,createdAt:new Date('2026-10-18T12:00:00Z')},{_id:b,userId:'alice',name:'Travel',budgetCents:100000,revision:0,createdAt:new Date('2026-10-18T12:00:00Z')},{_id:c,userId:'bob',name:'Private',budgetCents:900000,revision:0,createdAt:new Date('2026-10-18T12:00:00Z')}],WalletTransfer:[],Transaction:[{_id:'expense',userId:'alice',walletId:a,amount:-100,date:new Date('2026-10-10')},{_id:'foreign',userId:'bob',walletId:a,amount:-9999,date:new Date('2026-10-10')}]};
 const match=(row,query)=>Object.entries(query).every(([key,value])=>{
  if(key==='$and')return value.every(part=>match(row,part));
  if(value&&typeof value==='object'&&!(value instanceof Date)){
   if('$in'in value)return value.$in.includes(row[key]);
   if('$gte'in value||'$lte'in value)return row[key]>=value.$gte&&row[key]<=value.$lte;
   if('$lt'in value)return row[key]<value.$lt;
  }
  return row[key]===value;
 });
 const chain=value=>({select(){return this;},sort(){return this;},session(){return this;},lean(){return this;},then(resolve,reject){return Promise.resolve(value).then(resolve,reject);}});
 const models=Object.fromEntries(Object.keys(records).map(name=>[name,{
  find:query=>chain(records[name].filter(row=>match(row,query))),
  findOne:query=>chain(records[name].find(row=>match(row,query))??null),
  exists:query=>chain(Boolean(records[name].some(row=>match(row,query)))),
  findOneAndUpdate(query,update){const row=records[name].find(row=>match(row,query));if(row){Object.assign(row,update.$set??{});for(const[key,n]of Object.entries(update.$inc??{}))row[key]=(row[key]??0)+n;}return chain(row??null);},
  async create(body){const create=data=>{const row={_id:`id-${records[name].length}`,createdAt:new Date('2026-10-18T12:00:00Z'),...data};records[name].push(row);return row;};return Array.isArray(body)?body.map(create):create(body);},
 }]));
 let tail=Promise.resolve();let failWrite=false;
 const originalCreate=models.WalletTransfer.create;
 models.WalletTransfer.create=async body=>{if(failWrite)throw Error('write failure');return originalCreate(body);};
 const mongoose={isValidObjectId:value=>typeof value==='string'&&/^[a-f0-9]{24}$/.test(value),connection:{transaction:callback=>{
  const operation=tail.then(async()=>{const backup=structuredClone(records);try{return await callback({});}catch(error){for(const key of Object.keys(records))records[key]=backup[key];throw error;}});
  tail=operation.catch(()=>{});return operation;
 }}};
 const cache={};
 function load(file){if(cache[file])return cache[file];const exports=cache[file]={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/../${file}`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,{exports,Response,URL,Date,Number,Promise,console,require:name=>{
   if(name==='server-only')return{};
   if(name==='next/server')return{NextResponse};
   if(name==='mongoose')return{default:mongoose,__esModule:true};
   if(name==='@/lib/db')return{default:async()=>{},__esModule:true};
   if(name==='@/lib/current-user')return{requireUser:async()=>owner??NextResponse.json({error:'Unauthorized'},{status:401})};
   if(name.startsWith('@/models/'))return{default:models[name.split('/').pop()],__esModule:true};
   if(name==='./money-cents.mjs')return require('./money-cents.mjs');
   if(name==='./cycle-server')return{userCycle:async()=>({...cycle,isOpen:false})};
   if(name==='./spending-cycle.js')return{getSpendingCycle:()=>cycle};
   if(name==='./wallet-budget'||name==='@/lib/wallet-budget')return load('lib/wallet-budget.ts');
   if(name==='@/lib/wallet-server')return load('lib/wallet-server.ts');
   throw Error(name);
  }});return exports;
 }
 const request=body=>new Request('http://localhost/api/nori/wallet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 return{records,load,request,setCycle:value=>{cycle=value;},user:value=>{owner=value;},fail:value=>{failWrite=value;}};
}
test('wallet API scopes reads, ignores injected owners and validates create/update',async()=>{
 const f=fixture(),route=f.load('app/api/nori/wallet/route.ts');
 let response=await route.GET();const data=await response.json();
 assert.equal(data.wallets.length,2);assert.equal(data.wallets[0].spentCents,10000,'Foreign and unassigned spending is excluded');
 response=await route.POST(f.request({name:'Meals',budget:'5000',userId:'bob'}));
 assert.equal(response.status,201);assert.equal((await response.json()).userId,'alice');
 assert.equal((await route.POST(f.request({name:'Invalid',budget:'0.001'}))).status,400);
 const edit=f.load('app/api/nori/wallet/[id]/route.ts');
 assert.equal((await edit.PATCH(f.request({name:'Hacked',budget:'1'}),{params:Promise.resolve({id:c})})).status,404);
 f.user(null);assert.equal((await route.GET()).status,401);
});
test('transfer conserves allocation, is idempotent and rejects foreign wallets and overspending',async()=>{
 const f=fixture(),route=f.load('app/api/nori/wallet/transfer/route.ts');
 const body={fromWalletId:a,toWalletId:b,amount:'500',requestId:'request-0001'};
 assert.equal((await route.POST(f.request(body))).status,201);
 assert.equal((await route.POST(f.request(body))).status,200);assert.equal(f.records.WalletTransfer.length,1);
 const summary=await(await f.load('app/api/nori/wallet/route.ts').GET()).json();
 assert.equal(summary.wallets[0].remainingCents,40000);assert.equal(summary.wallets[1].remainingCents,150000);
 assert.equal(summary.wallets.reduce((sum,w)=>sum+w.allocatedCents,0),200000);
 assert.equal(f.records.Transaction.length,2,'Transfers never create spending records');
 assert.equal((await route.POST(f.request({...body,amount:'1'}))).status,409,'Idempotency key cannot be reused with new values');
 assert.equal((await route.POST(f.request({...body,toWalletId:c,requestId:'request-0002'}))).status,404);
 assert.equal((await route.POST(f.request({...body,amount:'401',requestId:'request-0003'}))).status,409);
 assert.equal((await route.POST(f.request({...body,toWalletId:a,requestId:'request-0004'}))).status,400);
});
test('competing transfers cannot both consume the same available budget and failed writes roll back',async()=>{
 const f=fixture(),route=f.load('app/api/nori/wallet/transfer/route.ts');
 const body={fromWalletId:a,toWalletId:b,amount:'600'};
 const result=await Promise.all(['request-1111','request-2222'].map(requestId=>route.POST(f.request({...body,requestId}))));
 assert.deepEqual(result.map(response=>response.status).sort(),[201,409]);assert.equal(f.records.WalletTransfer.length,1);
 const revision=f.records.Wallet[0].revision;
 f.fail(true);
 assert.equal((await route.POST(f.request({...body,amount:'1',requestId:'request-3333'}))).status,503);
 assert.equal(f.records.Wallet[0].revision,revision);assert.equal(f.records.WalletTransfer.length,1);
});


test('a new spending cycle starts with configured budgets and excludes previous transfers and expenses',async()=>{
 const f=fixture();
 await f.load('app/api/nori/wallet/transfer/route.ts').POST(f.request({fromWalletId:a,toWalletId:b,amount:'500',requestId:'cycle-reset-test'}));
 f.setCycle({startDate:new Date('2026-10-29T17:00:00Z'),endDate:new Date('2026-11-29T16:59:59.999Z')});
 const data=await(await f.load('app/api/nori/wallet/route.ts').GET()).json();
 assert.equal(data.transfers.length,0);
 assert.equal(data.wallets[0].spentCents,0);
 assert.equal(data.wallets[0].remainingCents,100000);
 assert.equal(data.wallets[1].remainingCents,100000);
});


test('wallet transfer grouping follows edited date boundaries rather than its original cycle label',async()=>{
 const f=fixture();
 await f.load('app/api/nori/wallet/transfer/route.ts').POST(f.request({fromWalletId:a,toWalletId:b,amount:'500',requestId:'date-group-test'}));
 const original=f.records.WalletTransfer[0].cycleKey;
 f.setCycle({startDate:new Date('2026-10-16T17:00:00Z'),endDate:new Date('2026-10-18T16:59:59.999Z')});
 const data=await(await f.load('app/api/nori/wallet/route.ts').GET()).json();
 assert.equal(data.transfers.length,1);assert.equal(data.wallets[0].spentCents,0);
 assert.equal(data.wallets[0].remainingCents,50000);
 assert.equal(f.records.WalletTransfer[0].cycleKey,original);
});

test('archiving hides new-use eligibility without dropping historical spending, and can be reversed',async()=>{
 const f=fixture(),route=f.load('app/api/nori/wallet/[id]/route.ts');
 const params={params:Promise.resolve({id:a})};
 assert.equal((await route.PATCH(f.request({archived:true}),params)).status,200);
 let data=await(await f.load('app/api/nori/wallet/route.ts').GET()).json();
 assert.equal(data.wallets[0].archived,true);assert.equal(data.wallets[0].spentCents,10000);
 assert.equal((await f.load('app/api/nori/wallet/transfer/route.ts').POST(f.request({fromWalletId:a,toWalletId:b,amount:'1',requestId:'archived-transfer'}))).status,409);
 assert.equal((await route.PATCH(f.request({archived:true}),{params:Promise.resolve({id:c})})).status,404);
 assert.equal((await route.PATCH(f.request({archived:false}),params)).status,200);
 data=await(await f.load('app/api/nori/wallet/route.ts').GET(new Request('http://localhost/api/nori/wallet?startDate=2026-11-01&endDate=2026-11-29'))).json();
 assert.equal(data.wallets[0].archived,false);assert.equal(data.wallets[0].spentCents,0);
 assert.equal((await f.load('app/api/nori/wallet/route.ts').GET(new Request('http://localhost/api/nori/wallet?startDate=bad&endDate=2026-11-29'))).status,400);
});

test('wallet choices are owner-scoped metadata and do not need expense aggregation',async()=>{
 const f=fixture();f.records.Transaction=null;
 const response=await f.load('app/api/nori/wallet/route.ts').GET(new Request('http://localhost/api/nori/wallet?choices=1'));
 assert.equal(response.status,200);const wallets=await response.json();assert.equal(wallets.length,2);assert.ok(wallets.every(wallet=>wallet.userId==='alice'));
});

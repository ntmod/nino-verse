const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
test('Dashboard transactions render independently and a late read cannot overwrite a confirmed save', async()=>{
  const states=[],refs=[];let i=0,r=0,effects=[],finish;
  const pending=new Promise(resolve=>{finish=resolve;});
  const never=new Promise(()=>{});
  const cycle={startDate:new Date('2026-09-30T00:00:00Z'),endDate:new Date('2026-10-29T23:59:59Z')};
  const fakeReact={...React,useState:initial=>{const key=i++;if(!(key in states))states[key]=initial;return[states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];},useRef:initial=>refs[r++]??={current:initial},useEffect:effect=>effects.push(effect),useMemo:fn=>fn()};
  const stubs={react:fakeReact,
    '@/lib/use-spending-cycles':{useSpendingCycles:()=>({state:{config:{mode:'fixed'},cycles:[],currentIndex:0},setState(){},error:false,retry(){}})},
    '@/lib/auth-client':{authClient:{useSession:()=>({data:{user:{id:'alice'}}})}},
    '@/lib/language-context':{useLanguage:()=>({language:'en',t:key=>key})},
    '@/lib/modal-context':{useModal:()=>({openGlobalModal(){},openExpenseModal(){}})},
    '@/lib/services/categoryService':{categoryService:{getAll:async()=>[]}},
    '@/lib/services/paymentService':{paymentService:{getAll:()=>never}},
    '@/lib/services/dashboardService':{budgetService:{getAll:()=>never},fixedCostService:{getAll:()=>never}},
    '@/lib/services/transactionService':{transactionService:{getAll:()=>pending}},
    '@/lib/spending-cycle.js':{getSpendingCycle:()=>cycle},
    '@/lib/cycle-garden.mjs':{getGardenSaveFeedback:()=>null},
    '@/lib/fixed-cost-status': {isFixedCostPaid:()=>false},
    '@/lib/budget-progress.mjs':{budgetProgress:()=>[]},
    '@/lib/ui-sounds.mjs':{playUISound(){},prepareUISound(){}},
    'framer-motion':{motion:{div:'div'},useReducedMotion:()=>true,useAnimationControls:()=>({})},
    'lucide-react':{},
  };
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/../app/(app)/dashboard/page.tsx`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>stubs[name]??(name==='react/jsx-runtime'?require(name):{__esModule:true,default:name.split('/').pop()}),fetch:()=>never,localStorage:{getItem:()=>null},console});
  const render=()=>{i=0;r=0;effects=[];return exports.default();};
  function find(node,predicate){if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of [node.props?.children].flat(Infinity)){const hit=find(child,predicate);if(hit)return hit;}}
  render();const cleanup=effects.map(effect=>effect());
  const saved={_id:'new',date:'2026-10-17',name:'Lunch',amount:-50,category:'food',paymentMethod:'cash'};
  find(render(),node=>node.type==='FloatingActionButton').props.onSuccess(saved);
  finish([]);
  await new Promise(resolve=>setImmediate(resolve));
  const tree=render();
  const card=name=>find(tree,node=>node.props?.['data-dashboard-card']===name).props.children;
  assert.equal(card('TotalSpentCard').props.isLoading,false,'Totals must not wait for methods, budgets, or daily average');
  assert.equal(card('TotalSpentCard').props.amount,50,'Late initial request must not erase a saved record');
  assert.equal(card('MetricsCard').props.isLoading,true,'Average has its own loading state');
  assert.equal(card('PaymentMethodsCard').props.isLoading,true,'Payment metadata only blocks its own card');
  assert.equal(card('BudgetListCard').props.isLoading,true,'Budgets have their own loading state');
  stubs['@/lib/use-spending-cycles'].useSpendingCycles=()=>({state:{config:{mode:'manual'},currentIndex:2,cycles:[
    {startDate:'2026-08-01T00:00:00Z',endDate:'2026-08-31T23:59:59.999Z',isOpen:false},
    {startDate:'2026-09-01T00:00:00Z',endDate:'2026-09-24T23:59:59.999Z',isOpen:false},
    {startDate:'2026-09-25T00:00:00Z',endDate:'2026-10-18T23:59:59.999Z',isOpen:true}]},setState(){},error:false,retry(){}});
  const manual=render();
  assert.equal(find(manual,node=>node.props?.['data-dashboard-card']==='TotalSpentCard').props.children.props.openEnded,true);
  assert.ok(find(manual,node=>node.type==='button'&&node.props.children==='Start new cycle'));
  await find(manual,node=>node.type==='button'&&node.props?.['aria-label']==='previous_cycle').props.onClick();
  const previous=render();
  assert.equal(find(previous,node=>node.props?.['data-dashboard-card']==='TotalSpentCard').props.children.props.openEnded,false);
  assert.equal(find(previous,node=>node.type==='button'&&node.props.children==='Start new cycle'),undefined);
  cleanup.forEach(fn=>fn?.());
});

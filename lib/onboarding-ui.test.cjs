const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,find,settle}=require('./transaction-form.test-support.cjs');
function setup(ok=true){
 let payload,calls=0,clears=0,replaced;
 const h=harness('../app/onboarding/Onboarding.tsx',{
  '@/lib/onboarding-presets.mjs':require('./onboarding-presets.mjs'),
  'next/navigation':{useRouter:()=>({replace:path=>{replaced=path;},refresh(){}})},
  '@/lib/language-context':{useLanguage:()=>({language:'en',setLanguage(){}})},
  '@/lib/metadata-cache':{clearMetadataCache(){clears++;}},
  testFetch:async(url,options)=>{assert.equal(url,'/api/nori/onboarding');payload=JSON.parse(options.body);calls++;return{ok};},
 });
 const render=()=>h.render({name:'Alex'});
 const primary=()=>find(render(),n=>n.type==='button'&&n.props?.className?.includes('flex-1'));
 const advance=()=>{const button=primary();if(button.props.type==='submit')find(render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});else button.props.onClick();};
 return{h,render,advance,get payload(){return payload;},get calls(){return calls;},get clears(){return clears;},get replaced(){return replaced;}};
}
const change=(node,value)=>node.props.onChange({target:{value}});
test('onboarding includes cycle settings and multiple budget wallets and sends one validated setup request',async()=>{
 const s=setup();s.advance();s.advance();
 change(find(s.render(),n=>n.type==='input'&&n.props.id==='wallet-name'),'Bank B');s.advance();
 assert.ok(find(s.render(),n=>n.type==='input'&&n.props.name==='onboarding-cycle'));
 change(find(s.render(),n=>n.type==='input'&&n.props.type==='number'),'25');s.advance();
 change(find(s.render(),n=>n.type==='input'&&n.props.maxLength===80),'Meals');
 change(find(s.render(),n=>n.type==='input'&&n.props.type==='number'),'5000');
 find(s.render(),n=>n.type==='button'&&Array.isArray(n.props.children)&&n.props.children.includes('Add another wallet')).props.onClick();
 change(find(s.render(),n=>n.type==='input'&&n.props.maxLength===80&&n.props.value===''),'Travel');
 change(find(s.render(),n=>n.type==='input'&&n.props.type==='number'&&n.props.value===''),'1200.50');
 s.advance();s.advance();await settle();
 assert.equal(s.calls,1);assert.equal(s.payload.walletName,'Bank B');assert.deepEqual(s.payload.cycle,{mode:'fixed',fixedDay:25});
 assert.deepEqual(s.payload.budgetWallets,[{name:'Meals',budget:'5000'},{name:'Travel',budget:'1200.50'}]);
 assert.equal(s.clears,1);assert.equal(s.replaced,'/home');
});
test('custom cycle setup can skip only wallets while retaining other onboarding choices',async()=>{
 const s=setup();s.advance();s.advance();s.advance();
 find(s.render(),n=>n.type==='input'&&n.props.type==='radio'&&n.props.checked===false).props.onChange();
 change(find(s.render(),n=>n.type==='input'&&n.props.type==='date'),'2026-09-25');s.advance();
 find(s.render(),n=>n.type==='button'&&n.props.children==='Skip budget wallets for now').props.onClick();await settle();
 assert.deepEqual(s.payload.cycle,{mode:'manual',startDate:'2026-09-25'});assert.deepEqual(s.payload.budgetWallets,[]);
 assert.equal(s.payload.skip,undefined);assert.ok(s.payload.categories.length>0);assert.equal(s.replaced,'/home');
});
test('failed setup keeps cycle and wallet inputs for retry and does not navigate',async()=>{
 const s=setup(false);s.advance();s.advance();s.advance();s.advance();
 change(find(s.render(),n=>n.type==='input'&&n.props.maxLength===80),'Meals');
 change(find(s.render(),n=>n.type==='input'&&n.props.type==='number'),'5000');s.advance();await settle();
 assert.equal(s.replaced,undefined);assert.equal(s.clears,0);assert.ok(find(s.render(),n=>n.props?.role==='alert'));
 assert.equal(find(s.render(),n=>n.type==='input'&&n.props.maxLength===80).props.value,'Meals');
});

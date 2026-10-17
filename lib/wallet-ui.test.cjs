const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,find,settle}=require('./transaction-form.test-support.cjs');
const snapshot={cycleKey:'2026-09-29T17:00:00Z',cycleEnd:'2026-10-29T16:59:59.999Z',wallets:[{_id:'meals',name:'Meals',budgetCents:500000,allocatedCents:500000,spentCents:100000,remainingCents:400000},{_id:'travel',name:'Travel',budgetCents:200000,allocatedCents:200000,spentCents:0,remainingCents:200000}],transfers:[]};
const button=(tree,text)=>find(tree,n=>n.type==='button'&&(n.props.children===text||Array.isArray(n.props.children)&&n.props.children.includes(text)));
test('wallet creation is saved through the API and failures retain the form',async()=>{
 let fail=true,payload;
 const h=harness('../app/(app)/wallets/page.tsx',{'@/lib/services/walletService':{walletService:{getAll:async()=>snapshot,create:async data=>{payload=data;if(fail)throw Error('offline');}}}});
 h.render();h.runEffects();await settle();
 button(h.render(),'Add wallet').props.onClick();
 find(h.render(),n=>n.type==='input'&&n.props.maxLength===80).props.onChange({target:{value:'Coffee'}});
 find(h.render(),n=>n.type==='input'&&n.props.type==='number').props.onChange({target:{value:'800'}});
 await find(h.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(find(h.render(),n=>n.type==='input'&&n.props.maxLength===80).props.value,'Coffee');
 assert.ok(find(h.render(),n=>n.props?.role==='alert'));
 fail=false;
 await find(h.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(payload.name,'Coffee');assert.equal(payload.budget,'800');
 assert.equal(find(h.render(),n=>n.type==='form'),undefined);
});
test('wallet picker loads independently, keeps selected IDs and reports wallet names for receipts',async()=>{
 let selection;
 const h=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>snapshot.wallets}}});
 const props={value:'meals',onChange:(id,name)=>{selection={id,name};}};
 const tree=h.render(props);assert.equal(find(tree,n=>n.type==='select').props.disabled,true);
 h.runEffects();await settle();
 assert.deepEqual(selection,{id:'meals',name:'Meals'});
 assert.equal(find(h.render(props),n=>n.type==='select').props.disabled,false);
});
test('wallet picker failure preserves the saved wallet instead of silently removing it',async()=>{
 const h=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>{throw Error('offline');}}}});
 const props={value:'meals',onChange(){throw Error('Must retain selection');}};
 h.render(props);h.runEffects();await settle();
 assert.equal(find(h.render(props),n=>n.type==='select').props.value,'meals');
 assert.ok(find(h.render(props),n=>n.props?.role==='alert'));
});

test('optional wallet picker disappears for people without wallets and ignores archived category defaults',async()=>{
 let selection='untouched';
 const h=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>[]}}});
 const props={value:'',onChange:id=>{selection=id;}};
 assert.equal(h.render(props),null);h.runEffects();await settle();assert.equal(h.render(props),null);assert.equal(selection,'untouched');
 const archived=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>snapshot.wallets.map(wallet=>({...wallet,archived:true}))}}});
 const defaults={value:'',autoSelect:true,category:{_id:'food',name:'Food',type:'expense',defaultWalletId:'meals'},onChange:id=>{selection=id;}};
 archived.render(defaults);archived.runEffects();await settle();archived.render(defaults);archived.runEffects();assert.equal(selection,'');
});
test('category defaults apply once per category and explicit no-wallet choices survive re-rendering',async()=>{
 let selected='';
 const h=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>snapshot.wallets}}});
 const props={value:'',autoSelect:true,category:{_id:'food',name:'Food',type:'expense',defaultWalletId:'meals'},onChange:id=>{selected=id;}};
 h.render(props);h.runEffects();await settle();h.render(props);h.runEffects();assert.equal(selected,'meals');
 const tree=h.render({...props,value:'meals'});h.runEffects();find(tree,n=>n.type==='select').props.onChange({target:{value:''}});assert.equal(selected,'');
 h.render(props);h.runEffects();assert.equal(selected,'','No wallet must not be auto-selected away on each render');
});
test('archived wallet is kept when editing an old record and cleared when filling a new template',async()=>{
 for(const allowArchived of [true,false]){
  let selected;
  const h=harness('../components/WalletPicker.tsx',{'@/lib/services/walletService':{walletService:{getChoices:async()=>[{...snapshot.wallets[0],archived:true}]}}});
  const props={value:'meals',allowArchived,onChange:id=>{selected=id;}};
  h.render(props);h.runEffects();await settle();assert.equal(selected,allowArchived?'meals':'');
 }
});

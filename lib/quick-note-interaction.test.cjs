const { test } = require('node:test');
const assert = require('node:assert/strict');
const { harness, find, categories, methods, deferred, settle } = require('./transaction-form.test-support.cjs');
const amount = tree => find(tree, n => n.type === 'input' && n.props?.inputMode === 'decimal');
const description = tree => find(tree, n => n.type === 'input' && n.props?.maxLength === 200 && n.props?.inputMode !== 'decimal');
const change = (node, value) => node.props.onChange({ target: { value } });
for (const variant of ['home', 'modal']) {
  test(`${variant}: editable during metadata loading, deduplicated saves, shared validation and reset`, async () => {
    const cats = deferred(), pays = deferred(), write = deferred(); let calls = 0, receipt;
    const h = harness('../components/TransactionForm.tsx', {
      '@/lib/services/categoryService': { categoryService: { getAll: () => cats.promise } },
      '@/lib/services/paymentService': { paymentService: { getAll: () => pays.promise } },
      '@/lib/services/transactionService': { transactionService: { create: data => { calls++; assert.equal(data.amount, -1234.50); return write.promise; } } },
    });
    const props = { variant, onSaved: value => { receipt = value; } };
    const initial = h.render(props); h.runEffects();
    assert.equal(find(initial, n => n.type === 'fieldset').props.disabled, false);
    change(amount(initial), '1234.50'); change(description(initial), '  Lunch  ');
    cats.resolve(categories); pays.resolve(methods); await settle();
    let tree = h.render(props);
    assert.equal(amount(tree).props.value, '1,234.50');
    const save = tree.props.onSubmit({ preventDefault() {} });
    await tree.props.onSubmit({ preventDefault() {} });
    assert.equal(calls, 1);
    write.resolve({ _id: 'new', amount: -1234.50, category: 'food', paymentMethod: 'cash', name: 'Lunch' });
    await save;
    assert.equal(receipt.categoryName, 'Food'); assert.equal(receipt.paymentName, 'Cash');
    tree = h.render(props);
    assert.equal(amount(tree).props.value, ''); assert.equal(description(tree).props.value, '');
    change(amount(tree), '0');
    await h.render(props).props.onSubmit({ preventDefault() {} });
    assert.equal(calls, 1, 'Invalid amounts never reach the API');
  });
}
test('edit and template prefill resolve legacy names, preserve date/subcategory, and select create vs update', async () => {
  for (const isEdit of [false, true]) {
    let operation, payload;
    const service = { create: async data => { operation = 'create'; payload = data; return { ...data, _id: 'new' }; }, update: async (id, data) => { operation = id; payload = data; return { ...data, _id: id }; } };
    const h = harness('../components/TransactionForm.tsx', { '@/lib/services/transactionService': { transactionService: service } });
    const props = { variant: 'modal', initialTransaction: { ...(isEdit ? { _id: 'old' } : {}), name: 'Lunch', amount: -85.25, category: 'Food', subCategory: 'lunch', paymentMethod: 'Cash', date: '2026-10-12' }, onSaved() {} };
    h.render(props); h.runEffects(); await settle();
    await h.render(props).props.onSubmit({ preventDefault() {} });
    assert.equal(operation, isEdit ? 'old' : 'create');
    assert.equal(payload.category, 'food'); assert.equal(payload.paymentMethod, 'cash');
    assert.equal(payload.subCategory, 'lunch'); assert.equal(payload.date, '2026-10-12'); assert.equal(payload.amount, -85.25);
  }
});
test('API failure keeps draft and unlocks a retry; income uses the same signed-money rules', async () => {
  let fail = true, saved, calls = 0;
  const h = harness('../components/TransactionForm.tsx', { '@/lib/services/transactionService': { transactionService: { create: async data => { calls++; if (fail) throw Error('offline'); return { ...data, _id: 'new' }; } } } });
  const props = { variant: 'home', initialTransaction: { category: 'salary', amount: 500, name: 'Pay' }, onSaved: value => { saved = value.transaction; } };
  h.render(props); h.runEffects(); await settle();
  await h.render(props).props.onSubmit({ preventDefault() {} });
  assert.equal(saved, undefined, 'Failed requests must not emit success feedback');
  assert.equal(amount(h.render(props)).props.value, '500'); assert.equal(description(h.render(props)).props.value, 'Pay');
  fail = false; await h.render(props).props.onSubmit({ preventDefault() {} });
  assert.equal(calls, 2); assert.equal(saved.amount, 500);
});
test('Home owns history only and retains confirmed saves when initial history arrives late', async () => {
  const history = deferred();
  const h = harness('../app/(app)/home/page.tsx', { '@/lib/services/transactionService': { transactionService: { getAll: () => history.promise } } });
  const tree = h.render(); h.runEffects();
  const form = find(tree, n => n.type === 'TransactionForm'); assert.ok(form);
  const saved = { _id: 'new', name: 'Lunch', amount: -50, category: 'food', paymentMethod: 'cash', date: '2026-10-17' };
  form.props.onSaved({ transaction: saved });
  history.resolve([{ ...saved, _id: 'older', name: 'Breakfast' }]); await settle();
  assert.ok(h.states.some(value => Array.isArray(value) && value.length === 2 && value.some(item => item?._id === 'new')));
});


test('Home fixed-cost shortcut fills a new transaction, can be selected again, and cannot replace an in-flight save', async () => {
  const template = { _id: 'template-id', name: 'Rent', amount: 9500, category: 'food', paymentMethod: 'cash' };
  let writes = 0;
  const h = harness('../app/(app)/home/page.tsx', {
    '@/lib/services/dashboardService': { fixedCostService: { getAll: async () => [template] } },
    '@/lib/services/transactionService': { transactionService: { getAll: async () => [], create: async () => { writes++; } } },
  });
  h.render(); h.runEffects(); await settle();
  const shortcut = tree => find(tree, n => n.type === 'button' && n.props?.className?.includes('min-h-16'));
  const form = tree => find(tree, n => n.type === 'TransactionForm');
  shortcut(h.render()).props.onClick();
  let filled = form(h.render());
  assert.equal(filled.props.initialTransaction._id, undefined, 'A template must never update a transaction with the template ID');
  assert.equal(filled.props.initialTransaction.name, 'Rent');
  assert.equal(filled.props.initialTransaction.amount, 9500);
  assert.equal(filled.props.initialTransaction.category, 'food');
  assert.equal(filled.props.initialTransaction.paymentMethod, 'cash');
  assert.equal(writes, 0, 'Selecting a shortcut only fills the form');
  const firstKey = filled.key;
  shortcut(h.render()).props.onClick(); filled = form(h.render());
  assert.notEqual(filled.key, firstKey, 'Selecting the same template again resets all fields');
  filled.props.onSavingChange(true);
  const savingTree = h.render(); const savingKey = form(savingTree).key;
  assert.equal(shortcut(savingTree).props.disabled, true);
  shortcut(savingTree).props.onClick();
  assert.equal(form(h.render()).key, savingKey, 'Even a same-tick click must respect the saving guard');
});


test('Home shows only four shortcuts and the searchable panel closes after filling a result', async () => {
  const templates = Array.from({length: 8}, (_, i) => ({_id: `fixed-${i}`, name: i === 7 ? 'Monthly Rent' : `Expense ${i}`, amount: 100 + i, category: 'food', paymentMethod: 'cash'}));
  const h = harness('../app/(app)/home/page.tsx', { '@/lib/services/dashboardService': { fixedCostService: {getAll: async () => templates} } });
  h.render(); h.runEffects(); await settle();
  const all = (node, predicate) => {
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => all(child, predicate))];
  };
  let tree = h.render();
  assert.equal(all(tree, n => Boolean(n.props?.['data-fixed-shortcut'])).length, 4);
  const root = find(tree, n => typeof n.props?.onOpenChange === 'function');
  root.props.onOpenChange(true);
  tree = h.render();
  find(tree, n => n.type === 'input' && n.props.type === 'search').props.onChange({target: {value: '  rEnT  '}});
  tree = h.render();
  const results = all(tree, n => n.type === 'button' && n.props?.className?.includes('min-h-16'));
  assert.equal(results.length, 1);
  results[0].props.onClick();
  tree = h.render();
  assert.equal(find(tree, n => typeof n.props?.onOpenChange === 'function').props.open, false);
  assert.equal(find(tree, n => n.type === 'TransactionForm').props.initialTransaction.name, 'Monthly Rent');
  assert.equal(find(tree, n => n.type === 'input' && n.props.type === 'search').props.value, '');
});


test('Home fixed-cost pagination visits all items and fills from the final partial page', async () => {
  const templates = Array.from({length: 9}, (_, i) => ({_id: `fixed-${i}`, name: `Expense ${i}`, amount: i + 10, category: 'food', paymentMethod: 'cash'}));
  const h = harness('../app/(app)/home/page.tsx', { '@/lib/services/dashboardService': {fixedCostService: {getAll: async () => templates}} });
  h.render(); h.runEffects(); await settle();
  const page = () => find(h.render(), n => n.type === 'nav');
  const previous = () => find(page(), n => n.type === 'button');
  const next = () => find(page(), n => n.type === 'button' && n.props.children === 'Next →');
  assert.equal(previous().props.disabled, true);
  next().props.onClick();
  assert.ok(find(h.render(), n => n.props?.['data-fixed-shortcut'] === 'fixed-4'));
  next().props.onClick();
  assert.equal(next().props.disabled, true);
  assert.equal(find(h.render(), n => n.props?.['data-fixed-shortcut'] === 'fixed-7'), undefined);
  find(h.render(), n => n.props?.['data-fixed-shortcut'] === 'fixed-8').props.onClick();
  assert.equal(find(h.render(), n => n.type === 'TransactionForm').props.initialTransaction.name, 'Expense 8');
  previous().props.onClick();
  assert.ok(find(h.render(), n => n.props?.['data-fixed-shortcut'] === 'fixed-4'));
});


test('Home crosses off cycle records in both shortcut and picker, and marks new saves immediately', async () => {
  const template = {_id:'rent',name:'Rent',amount:9000,category:'food',paymentMethod:'cash'};
  const old = {_id:'record',name:'RENT',amount:-9000,category:'food',paymentMethod:'cash',date:'2026-10-01'};
  const h = harness('../app/(app)/home/page.tsx', {
    '@/lib/services/dashboardService': {fixedCostService:{getAll:async()=>[template]}},
    '@/lib/services/transactionService': {transactionService:{getAll:async()=>[old]}},
  });
  h.render();h.runEffects();await settle();
  const tree=h.render();
  const shortcut=find(tree,n=>n.props?.['data-fixed-shortcut']==='rent');
  assert.equal(shortcut.props.disabled,true);
  assert.ok(find(shortcut,n=>n.props?.className?.includes('line-through')));
  const result=find(tree,n=>n.type==='button'&&n.props?.className?.includes('min-h-16'));
  assert.equal(result.props.disabled,true);
  const h2=harness('../app/(app)/home/page.tsx',{'@/lib/services/dashboardService':{fixedCostService:{getAll:async()=>[template]}}});
  h2.render();h2.runEffects();await settle();
  assert.equal(find(h2.render(),n=>n.props?.['data-fixed-shortcut']==='rent').props.disabled,false);
  find(h2.render(),n=>n.type==='TransactionForm').props.onSaved({transaction:old});
  assert.equal(find(h2.render(),n=>n.props?.['data-fixed-shortcut']==='rent').props.disabled,true);
});


test('Home shows the shared stamped receipt and updates history before it is dismissed', () => {
  const h = harness('../app/(app)/home/page.tsx');
  const receipt = () => find(h.render(), n => n.type === 'receipt');
  assert.equal(receipt(), undefined);
  const saved = {_id:'new',name:'Lunch',amount:-85.25,category:'food',paymentMethod:'cash',date:'2026-10-17'};
  const details = {transaction:saved,categoryName:'Food',paymentName:'Cash'};
  find(h.render(), n => n.type === 'TransactionForm').props.onSaved(details);
  assert.equal(receipt().props.receipt, details);
  assert.ok(h.states.some(value => Array.isArray(value) && value.some(item => item?._id === 'new')), 'History updates without waiting for the receipt to close');
  receipt().props.onClose();
  assert.equal(receipt(), undefined);
});


test('Fixed-cost accordion starts collapsed and restores the account-specific toggle preference', async () => {
  const stored = new Map();
  const storage = {getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  const mount = () => {
    const h = harness('../app/(app)/home/page.tsx', {testStorage:storage});
    const details = find(h.render(), n => n.type === 'details');
    const element = {open:false}; details.props.ref.current = element;
    h.runEffects();
    return {h,details,element};
  };
  const first = mount();
  assert.equal(first.element.open,false);
  first.details.props.onToggle({currentTarget:{open:true}});
  assert.equal(stored.get('homeFixedCostsOpen:alice'),'true');
  const second = mount();
  assert.equal(second.element.open,true);
  second.details.props.onToggle({currentTarget:{open:false}});
  assert.equal(mount().element.open,false);
  await settle();
});

test('Home previews arithmetic, saves the computed amount, and keeps invalid expressions out of the API', async () => {
  let payload, calls=0;
  const h=harness('../components/TransactionForm.tsx',{'@/lib/services/transactionService':{transactionService:{create:async data=>{calls++;payload=data;return {...data,_id:'new'};}}}});
  const props={variant:'home',onSaved(){}};
  h.render(props);h.runEffects();await settle();
  change(amount(h.render(props)),'10+20×3');
  let tree=h.render(props);
  assert.ok(find(tree,n=>n.props?.id==='form-1-calculation').props.children.includes('70.00'));
  await tree.props.onSubmit({preventDefault(){}});
  assert.equal(payload.amount,-70);
  change(amount(h.render(props)),'100÷0');
  await h.render(props).props.onSubmit({preventDefault(){}});
  assert.equal(calls,1);
  assert.equal(amount(h.render(props)).props.value,'100÷0');
});


test('Equals replaces the expression with its result without saving and preserves invalid input', async () => {
  const h=harness('../components/TransactionForm.tsx');
  const props={variant:'home',onSaved(){throw Error('Equals must not save');}};
  h.render(props);h.runEffects();await settle();
  const equals=()=>find(h.render(props),n=>n.type==='button'&&n.props.children==='=');
  change(amount(h.render(props)),'1200+50×2');
  equals().props.onClick();
  assert.equal(amount(h.render(props)).props.value,'1,300.00');
  change(amount(h.render(props)),'10÷0');
  equals().props.onClick();
  assert.equal(amount(h.render(props)).props.value,'10÷0');
});


test('Modal arithmetic supports preview, equals, and saving expressions on create and edit', async () => {
  for (const editing of [false,true]) {
    let payload,operation;
    const service={create:async data=>{operation='create';payload=data;return {...data,_id:'new'};},update:async(id,data)=>{operation=id;payload=data;return {...data,_id:id};}};
    const h=harness('../components/TransactionForm.tsx',{'@/lib/services/transactionService':{transactionService:service}});
    const props={variant:'modal',initialTransaction:editing?{_id:'old',amount:-10,category:'food',paymentMethod:'cash',date:'2026-10-12'}:undefined,onSaved(){}};
    h.render(props);h.runEffects();await settle();
    change(amount(h.render(props)),'100+20×2');
    let tree=h.render(props);
    assert.ok(find(tree,n=>n.props?.id==='form-1-calculation').props.children.includes('140.00'));
    find(tree,n=>n.type==='button'&&n.props.children==='=').props.onClick();
    assert.equal(amount(h.render(props)).props.value,'140.00');
    change(amount(h.render(props)),'300÷4');
    await h.render(props).props.onSubmit({preventDefault(){}});
    assert.equal(payload.amount,-75);
    assert.equal(operation,editing?'old':'create');
    if(editing)assert.equal(payload.date,'2026-10-12');
  }
});


for (const variant of ['home','modal']) {
 test(`${variant}: wallet selection is optional, preserved on edits, and can be cleared`,async()=>{
  let payload,receipt;
  const h=harness('../components/TransactionForm.tsx',{'@/lib/services/transactionService':{transactionService:{update:async(id,data)=>{payload=data;return {...data,_id:id};}}}});
  const props={variant,initialTransaction:{_id:'old',name:'Lunch',amount:-80,category:'food',paymentMethod:'cash',walletId:'meals',date:'2026-10-12'},onSaved:value=>{receipt=value;}};
  h.render(props);h.runEffects();await settle();
  let tree=h.render(props);
  const picker=find(tree,n=>n.type==='WalletPicker');
  assert.equal(picker.props.value,'meals');
  picker.props.onChange('travel','Travel');
  await h.render(props).props.onSubmit({preventDefault(){}});
  assert.equal(payload.walletId,'travel');assert.equal(receipt.walletName,'Travel');
  tree=h.render(props);change(amount(tree),'50');
  find(tree,n=>n.type==='WalletPicker').props.onChange('');
  await h.render(props).props.onSubmit({preventDefault(){}});
  assert.equal(payload.walletId,'');assert.equal(receipt.walletName,undefined);
 });
}

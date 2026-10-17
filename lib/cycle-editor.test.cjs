const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,find,settle,deferred}=require('./transaction-form.test-support.cjs');
const state={config:{mode:'manual',revision:2,starts:['2026-09-29T17:00:00Z'],ids:['cycle']},cycles:[{cycleId:'cycle',startDate:'2026-09-29T17:00:00Z',endDate:'2026-10-18T16:59:59.999Z',isOpen:true}],currentIndex:0};
test('cycle editor previews first and requires a separate, deduplicated confirmation',async()=>{
 let previews=0,confirms=0,saved,closed=0;
 const write=deferred();
 const preview={previewHash:'hash',impact:{recordsMoved:3,transfersMoved:1,walletChanges:[],transfers:[]},state};
 const h=harness('../components/CycleEditor.tsx',{'@/lib/services/cycleService':{cycleService:{preview:async()=>{previews++;return preview;},confirm:()=>{confirms++;return write.promise;}}}});
 const props={state,action:'start',onSaved:value=>{saved=value;},onClose:()=>{closed++;}};
 const submit=()=>find(h.render(props),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 submit();await settle();
 assert.equal(previews,1);assert.equal(confirms,0);assert.equal(closed,0);
 assert.ok(find(h.render(props),n=>n.type==='button'&&n.props.children==='Confirm change'));
 submit();submit();assert.equal(confirms,1);
 write.resolve(state);await settle();assert.equal(saved,state);assert.equal(closed,1);
});
test('changing the date invalidates the previous preview',async()=>{
 const preview={previewHash:'hash',impact:{recordsMoved:0,transfersMoved:0,walletChanges:[],transfers:[]},state};
 const h=harness('../components/CycleEditor.tsx',{'@/lib/services/cycleService':{cycleService:{preview:async()=>preview}}});
 const props={state,action:'start',onSaved(){},onClose(){}};
 find(h.render(props),n=>n.type==='form').props.onSubmit({preventDefault(){}});await settle();
 find(h.render(props),n=>n.type==='input').props.onChange({target:{value:'2026-10-17'}});
 assert.ok(find(h.render(props),n=>n.type==='button'&&n.props.children==='Preview impact'));
});


test('settings preview sends both the selected mode and recurring day without an extra date field',async()=>{
 let change;
 const preview={previewHash:'hash',impact:{recordsMoved:0,transfersMoved:0,walletChanges:[],transfers:[]},state};
 const h=harness('../components/CycleEditor.tsx',{'@/lib/services/cycleService':{cycleService:{preview:async value=>{change=value;return preview;}}}});
 const props={state,action:'configure',mode:'fixed',fixedDay:25,onSaved(){},onClose(){}};
 assert.equal(find(h.render(props),n=>n.type==='input'&&n.props.type==='date'),undefined);
 find(h.render(props),n=>n.type==='form').props.onSubmit({preventDefault(){}});await settle();
 assert.equal(change.mode,'fixed');assert.equal(change.fixedDay,25);assert.equal(change.action,'configure');
});

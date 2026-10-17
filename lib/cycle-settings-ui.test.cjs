const {test}=require('node:test');
const assert=require('node:assert/strict');
const {harness,find}=require('./transaction-form.test-support.cjs');
test('cycle settings offer two radio choices and a validated recurring day',()=>{
 const h=harness('../app/(app)/settings/cycle/page.tsx');
 const radio=mode=>find(h.render(),n=>n.type==='input'&&n.props.type==='radio'&&n.props.value===mode);
 assert.equal(radio('fixed').props.checked,true);assert.equal(radio('manual').props.checked,false);
 const save=()=>find(h.render(),n=>n.type==='button'&&n.props.type==='submit');
 assert.equal(save().props.disabled,true);
 find(h.render(),n=>n.type==='input'&&n.props.type==='number').props.onChange({target:{value:'25'}});
 assert.equal(save().props.disabled,false);
 find(h.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 const editor=find(h.render(),n=>n.type==='CycleEditor');
 assert.equal(editor.props.action,'configure');assert.equal(editor.props.mode,'fixed');assert.equal(editor.props.fixedDay,25);
});
test('custom mode hides the recurring-day input and opens the settings preview',()=>{
 const h=harness('../app/(app)/settings/cycle/page.tsx');
 find(h.render(),n=>n.type==='input'&&n.props.value==='manual').props.onChange();
 assert.equal(find(h.render(),n=>n.type==='input'&&n.props.type==='number'),undefined);
 find(h.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(find(h.render(),n=>n.type==='CycleEditor').props.mode,'manual');
});

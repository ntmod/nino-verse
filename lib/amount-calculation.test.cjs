const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/amount-calculation.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
const {calculateAmount}=context.exports;
test('basic arithmetic uses precedence, parentheses, decimal amounts and final cents rounding',()=>{
 for(const [input,result] of [['50+25','75.00'],['100-25','75.00'],['120*2','240.00'],['300/4','75.00'],['10+20*3','70.00'],['(10+20)*3','90.00'],['120÷2+5×3−10','65.00'],['0.1+0.2','0.30'],['100/3','33.33'],['1005/1000','1.01'],['1,234.50','1234.50'],['.50+.25','0.75'],['10 - -5','15.00']]) assert.equal(calculateAmount(input),result,input);
});
test('incomplete, unsafe, nonpositive, divide-by-zero and executable expressions are rejected',()=>{
 for(const input of ['', '10+', '10/0', '10/(2-2)', '10-20', '0', '1.001', '1e3', '2**3', '(10+2', 'alert(1)', '1;process.exit()', '9007199254740992', '+'.repeat(201)+'1']) assert.throws(()=>calculateAmount(input),input);
});

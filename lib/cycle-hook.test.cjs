const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
test('cycle updates ignore stale responses and refresh on Bangkok midnight and return from sleep',async()=>{
 const requests=[],states=[];let index=0,effect,timer,cleared=false;
 let now=Date.parse('2026-10-18T16:59:59Z');
 class Clock extends Date{static now(){return now;}}
 const window=new EventTarget();
 const context={exports:{},Date:Clock,window,setTimeout:(callback,delay)=>{timer={callback,delay};return 1;},clearTimeout:()=>{cleared=true;},require:name=>{
  if(name==='react')return{useState:initial=>{const key=index++;if(!(key in states))states[key]=initial;return[states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];},useEffect:callback=>{effect=callback;}};
  if(name==='./services/cycleService')return{cycleService:{get:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}};
  throw Error(name);
 }};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${__dirname}/use-spending-cycles.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 const render=()=>{index=0;return context.exports.useSpendingCycles();};
 render();const cleanup=effect();
 assert.equal(requests.length,1);assert.equal(timer.delay,1100);
 window.dispatchEvent(new Event('nori:cycles-changed'));assert.equal(requests.length,2);
 const newer={config:{revision:2}};requests[1].resolve(newer);await new Promise(resolve=>setImmediate(resolve));
 requests[0].resolve({config:{revision:1}});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(render().state,newer);
 now+=2000;timer.callback();assert.equal(requests.length,3);
 requests[2].resolve(newer);await new Promise(resolve=>setImmediate(resolve));
 now+=86400000*2;window.dispatchEvent(new Event('focus'));assert.equal(requests.length,4);
 requests[3].resolve(newer);await new Promise(resolve=>setImmediate(resolve));
 cleanup();assert.equal(cleared,true);
});

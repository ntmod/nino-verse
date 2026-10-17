import assert from 'node:assert/strict';
import { onboardingPlan } from './onboarding-presets.mjs';
const body = { language: 'th', categories: ['food', 'food', 'travel'], walletName: ' เงินสด ', initialBalance: 0 };
const plan = onboardingPlan(body);
assert.equal(plan.categories.length, 3);
assert.equal(plan.categories[0].name, 'อาหาร');
assert.equal(plan.categories[2].type, 'income');
assert.equal(plan.wallet.name, 'เงินสด');
assert.equal(plan.wallet.initialBalance, undefined);
assert.equal(onboardingPlan({ ...body, initialBalance: 500 }).wallet.initialBalance, undefined);
assert.equal(onboardingPlan({ ...body, language: 'en' }).categories[0].name, 'Food');
for (const change of [{ categories: [] }, { categories: ['unknown'] }, { walletName: ' ' }, { language: 'xx' }]) assert.throws(() => onboardingPlan({ ...body, ...change }));
console.log('Onboarding setup checks passed');

const extended=onboardingPlan({...body,cycle:{mode:'fixed',fixedDay:25},budgetWallets:[{name:' Meals ',budget:'5000'},{name:'Travel',budget:'1200.50'}]});
assert.equal(extended.cycle.fixedDay,25);
assert.deepEqual(extended.budgetWallets,[{name:'Meals',budgetCents:500000},{name:'Travel',budgetCents:120050}]);
assert.equal(onboardingPlan({...body,budgetWallets:[]}).budgetWallets.length,0);
for(const change of [{cycle:{mode:'fixed',fixedDay:0}},{cycle:{mode:'fixed',fixedDay:32}},{cycle:{mode:'manual'}},{budgetWallets:[{name:' ',budget:'100'}]},{budgetWallets:[{name:'Meals',budget:'1.001'}]},{budgetWallets:Array.from({length:21},()=>({name:'Meals',budget:'100'}))}])assert.throws(()=>onboardingPlan({...body,...change}));

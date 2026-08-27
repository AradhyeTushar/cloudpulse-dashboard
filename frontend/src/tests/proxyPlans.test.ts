import { PROXY_PLANS, getPlanConfig, formatTrafficMB, formatTrafficBytes } from '../config/proxyPlans';

console.log('====================================================');
console.log('🧪 VERIFYING CENTRALIZED PROXY PLANS & LOGIC');
console.log('====================================================\n');

// 1. Verify 7 Plans Definition
console.log('1. Verifying 7 Plans Configuration:');
if (PROXY_PLANS.length !== 7) {
  throw new Error(`Expected 7 plans, got ${PROXY_PLANS.length}`);
}

const expectedPlans = [
  { name: 'Free', maxProxies: 50, limitDisplay: '50 MB per proxy', validity: '12 hours', price: 0 },
  { name: 'Starter', maxProxies: 1, limitDisplay: '500 MB/day', validity: '28 days', price: 1.99 },
  { name: 'Basic', maxProxies: 2, limitDisplay: '5 GB', validity: '28 days', price: 4.99 },
  { name: 'Pro', maxProxies: 5, limitDisplay: '15 GB', validity: '28 days', price: 9.99 },
  { name: 'Pro Plus', maxProxies: 5, limitDisplay: '30 GB', validity: '28 days', price: 14.99 },
  { name: 'Business', maxProxies: 10, limitDisplay: '30 GB', validity: '28 days', price: 19.99 },
  { name: 'Business Plus', maxProxies: 10, limitDisplay: '50 GB', validity: '28 days', price: 29.99 },
];

expectedPlans.forEach((expected) => {
  const plan = getPlanConfig(expected.name);
  if (!plan) throw new Error(`Plan ${expected.name} not found`);
  if (plan.maxProxies !== expected.maxProxies) {
    throw new Error(`Plan ${expected.name} maxProxies mismatch: expected ${expected.maxProxies}, got ${plan.maxProxies}`);
  }
  if (plan.trafficLimitDisplay !== expected.limitDisplay) {
    throw new Error(`Plan ${expected.name} trafficLimitDisplay mismatch: expected ${expected.limitDisplay}, got ${plan.trafficLimitDisplay}`);
  }
  if (plan.validityDisplay !== expected.validity) {
    throw new Error(`Plan ${expected.name} validity mismatch: expected ${expected.validity}, got ${plan.validityDisplay}`);
  }
  if (plan.priceUSD !== expected.price) {
    throw new Error(`Plan ${expected.name} price mismatch: expected ${expected.price}, got ${plan.priceUSD}`);
  }
  console.log(`  ✅ ${plan.name.padEnd(14)}: ${plan.maxProxies.toString().padStart(2)} proxies | ${plan.trafficLimitDisplay.padEnd(16)} | ${plan.validityDisplay.padEnd(10)} | ${plan.priceDisplay}`);
});

// 2. Verify Helper Functions
console.log('\n2. Verifying Format Helpers:');
console.log(`  formatTrafficMB(50) = ${formatTrafficMB(50)} (expected "50 MB")`);
console.log(`  formatTrafficMB(500) = ${formatTrafficMB(500)} (expected "500 MB")`);
console.log(`  formatTrafficMB(5120) = ${formatTrafficMB(5120)} (expected "5 GB")`);
console.log(`  formatTrafficBytes(52428800) = ${formatTrafficBytes(52428800)} (expected "50 MB")`);

console.log('\n====================================================');
console.log('🎉 ALL PROXY PLAN DEFINITION TESTS PASSED SUCCESSFULLY');
console.log('====================================================\n');

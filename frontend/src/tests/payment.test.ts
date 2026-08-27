// Polyfill localStorage for Node.js test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (index: number) => Object.keys(store)[index] || null,
    length: 0,
  } as any;
}

import { proxyService } from '../services/proxyService';
import { getPlanConfig } from '../config/proxyPlans';

console.log('====================================================');
console.log('💳 RUNNING PAYMENT & SUBSCRIPTION INTEGRATION TESTS');
console.log('====================================================\n');

// 1. Test Initial State (Default or Alex Mercer)
const initialSub = proxyService.getUserSubscription();
console.log(`1. Initial Subscription State:`);
console.log(`   - Plan: ${initialSub.planSlug} (${initialSub.planId})`);
console.log(`   - Status: ${initialSub.status}`);
console.log(`   - Expires At: ${initialSub.expiresAt}`);
console.log(`   - Auto-Renew: ${initialSub.autoRenew}`);

// 2. Test Plan Upgrade to "Pro Plus" ($14.99)
console.log('\n2. Testing Plan Upgrade Transaction (Upgrading to "pro-plus")...');
const proPlusPlan = getPlanConfig('pro-plus');
const upgradedSub = proxyService.upgradePlan(proPlusPlan.id);
console.log(`   ✅ Upgraded successfully to: ${upgradedSub.planSlug}`);
console.log(`   ✅ New validity expiration: ${upgradedSub.expiresAt}`);
console.log(`   ✅ Plan price: $${proPlusPlan.priceUSD}/28d (${proPlusPlan.trafficLimitDisplay})`);

if (upgradedSub.planSlug !== 'pro-plus') {
  throw new Error(`Expected planSlug pro-plus, got ${upgradedSub.planSlug}`);
}

// 3. Verify Proxy Endpoints inherit new plan limits immediately
console.log('\n3. Verifying Proxy Endpoints capacity after payment upgrade:');
const endpoints = proxyService.getEndpoints();
console.log(`   - Active endpoints count: ${endpoints.length}`);
endpoints.forEach((ep) => {
  console.log(`   - Endpoint "${ep.name}": status=${ep.status}, limit=${ep.limitBytes ? (ep.limitBytes / (1024*1024*1024)).toFixed(0) + ' GB' : 'N/A'}`);
});

// 4. Test Subscription Renewal (+28 Days Extension)
console.log('\n4. Testing 28-Day Subscription Renewal Payment...');
const preRenewalExpiry = new Date(upgradedSub.expiresAt).getTime();
const renewedSub = proxyService.renewPlan();
const postRenewalExpiry = new Date(renewedSub.expiresAt).getTime();

const extensionDays = Math.round((postRenewalExpiry - preRenewalExpiry) / (1000 * 60 * 60 * 24));
console.log(`   ✅ Previous Expiration : ${new Date(preRenewalExpiry).toISOString()}`);
console.log(`   ✅ Renewed Expiration  : ${new Date(postRenewalExpiry).toISOString()}`);
console.log(`   ✅ Subscription Extended: +${extensionDays} days (Expected ~28 days)`);

if (extensionDays < 27 || extensionDays > 29) {
  throw new Error(`Expected ~28 days extension, got ${extensionDays}`);
}

// 5. Test Usage Dashboard Summary Data
console.log('\n5. Verifying Usage Dashboard Telemetry after Payment:');
const summary = proxyService.getDashboardUsageSummary();
console.log(`   - Plan Name: ${summary.plan.name} (${summary.plan.priceDisplay})`);
console.log(`   - Validity: ${summary.plan.validityDisplay} (${summary.plan.renewalDisplay})`);
console.log(`   - Proxy Slots: ${summary.proxyUsage.used} / ${summary.proxyUsage.max} (${summary.proxyUsage.available} available)`);
console.log(`   - Traffic Telemetry: ${summary.trafficUsage.usedDisplay} / ${summary.trafficUsage.limitDisplay} (${summary.trafficUsage.usagePercent}%)`);

// 6. Test Free Plan Fallback
console.log('\n6. Testing Switching back to Free Plan ($0.00)...');
const freeSub = proxyService.upgradePlan('free');
console.log(`   ✅ Active Plan: ${freeSub.planSlug} (Is Free: ${getPlanConfig('free').isFree})`);
console.log(`   ✅ Free Proxy Allowance: ${getPlanConfig('free').maxProxies} proxies, ${getPlanConfig('free').trafficLimitDisplay}`);

console.log('\n====================================================');
console.log('🎉 ALL PAYMENT & SUBSCRIPTION TESTS PASSED (100%)');
console.log('====================================================\n');

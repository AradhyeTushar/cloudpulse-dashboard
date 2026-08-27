import { proxyService } from '../services/proxyService';
import { PROXY_PLANS } from '../config/proxyPlans';

// Setup Mock LocalStorage
const store: Record<string, string> = {};
((globalThis as any) || {}).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

console.log('====================================================');
console.log('🔒 TESTING IP BLOCKS & MULTI-PROXY WHITELISTS');
console.log('====================================================\n');

// 1. Initial State
const initialEndpoints = proxyService.getEndpoints();
console.log(`1. Initial Endpoints Count: ${initialEndpoints.length}`);
console.log(`   - Endpoint 1 Name: "${initialEndpoints[0].name}"`);
console.log(`   - Current Whitelist: [${initialEndpoints[0].ipWhitelist.join(', ')}] (Default: Open)\n`);

// 2. Testing Exact IP Whitelist Match
console.log('2. Testing Exact IP Match:');
const testUserIP = '110.227.184.49';
const singleRule = [testUserIP];

const matchExact = proxyService.testClientIPAgainstWhitelist(testUserIP, singleRule);
console.log(`   - Test Client IP: "${testUserIP}" against [${singleRule.join(', ')}]`);
console.log(`   - Result Allowed: ${matchExact.allowed}`);
console.log(`   - Reason: "${matchExact.reason}"`);
if (!matchExact.allowed) throw new Error('Expected exact IP to be allowed');
console.log('   ✅ Exact IP Authorization Passed\n');

// 3. Testing Blocked IP (Unauthorized client IP)
console.log('3. Testing Unauthorized Client IP Block:');
const blockedIP = '203.0.113.99';
const matchBlocked = proxyService.testClientIPAgainstWhitelist(blockedIP, singleRule);
console.log(`   - Test Client IP: "${blockedIP}" against [${singleRule.join(', ')}]`);
console.log(`   - Result Allowed: ${matchBlocked.allowed}`);
console.log(`   - Reason: "${matchBlocked.reason}"`);
if (matchBlocked.allowed) throw new Error('Expected unauthorized IP to be blocked');
console.log('   ✅ Unauthorized IP Correctly Blocked\n');

// 4. Testing CIDR Subnet Block (/24)
console.log('4. Testing CIDR Subnet Block (/24):');
const cidrRule = ['110.227.184.0/24', '192.168.1.0/24'];
const ipInSubnet1 = '110.227.184.15';
const ipInSubnet2 = '192.168.1.200';
const ipOutsideSubnet = '110.227.185.1';

const testSubnet1 = proxyService.testClientIPAgainstWhitelist(ipInSubnet1, cidrRule);
const testSubnet2 = proxyService.testClientIPAgainstWhitelist(ipInSubnet2, cidrRule);
const testOutside = proxyService.testClientIPAgainstWhitelist(ipOutsideSubnet, cidrRule);

console.log(`   - Client ${ipInSubnet1} in 110.227.184.0/24: ${testSubnet1.allowed} (${testSubnet1.matchedRule})`);
console.log(`   - Client ${ipInSubnet2} in 192.168.1.0/24: ${testSubnet2.allowed} (${testSubnet2.matchedRule})`);
console.log(`   - Client ${ipOutsideSubnet} outside subnets: allowed=${testOutside.allowed}`);

if (!testSubnet1.allowed || !testSubnet2.allowed || testOutside.allowed) {
  throw new Error('CIDR Subnet evaluation failed');
}
console.log('   ✅ CIDR IP Block Matching Passed\n');

// 5. Testing Multi-Proxy Bulk IP Whitelist Update
console.log('5. Testing Multi-Proxy Bulk IP Whitelist Update:');
// Upgrade plan to Pro to allow creating multiple proxies
proxyService.upgradePlan('plan_pro'); // 5 proxies allowed

// Create second proxy
const ep2 = proxyService.createEndpoint({
  name: 'Secondary Scraper Proxy',
  proxyType: 'residential',
  protocol: 'http',
  rotationMode: 'sticky',
  sessionDurationMin: 30,
  country: 'Germany',
  countryCode: 'DE',
  ipWhitelist: [],
});

const ep3 = proxyService.createEndpoint({
  name: 'Singapore Datacenter Proxy',
  proxyType: 'datacenter',
  protocol: 'socks5',
  rotationMode: 'rotating',
  country: 'Singapore',
  countryCode: 'SG',
  ipWhitelist: [],
});

const currentEps = proxyService.getEndpoints();
console.log(`   - Active Proxies: ${currentEps.length}`);
currentEps.forEach((e) => console.log(`     * ${e.name} (${e.id})`));

// Bulk update all proxies with the user's IP and subnet block
const updatedIPBlocks = ['110.227.184.49', '10.0.0.0/16'];
proxyService.bulkUpdateIPWhitelist([], updatedIPBlocks);

const refreshedEps = proxyService.getEndpoints();
console.log('\n   Verifying updated IP blocks across all proxies:');
refreshedEps.forEach((e) => {
  console.log(`     * ${e.name}: Whitelist = [${e.ipWhitelist.join(', ')}]`);
  if (e.ipWhitelist.join(', ') !== updatedIPBlocks.join(', ')) {
    throw new Error(`Proxy ${e.id} was not updated properly`);
  }
});
console.log('   ✅ All Proxies Bulk IP Blocks Successfully Synchronized\n');

// 6. Testing Specific Proxy Single IP Update
console.log('6. Testing Single Proxy IP Block Update:');
const customRule = ['198.51.100.22'];
proxyService.updateEndpointIPWhitelist(ep2.id, customRule);

const ep2Refreshed = proxyService.getEndpoints().find((e) => e.id === ep2.id);
console.log(`   - Proxy ${ep2.name} Whitelist: [${ep2Refreshed?.ipWhitelist.join(', ')}]`);
if (ep2Refreshed?.ipWhitelist.join(', ') !== customRule.join(', ')) {
  throw new Error('Single proxy update failed');
}
console.log('   ✅ Single Proxy IP Whitelist Update Passed\n');

console.log('====================================================');
console.log('🎉 ALL IP BLOCKS & MULTI-PROXY TESTS PASSED (100%)');
console.log('====================================================\n');

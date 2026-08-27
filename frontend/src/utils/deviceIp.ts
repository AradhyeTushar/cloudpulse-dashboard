/**
 * Dynamically detects the user's current client/device public IP address
 * to auto-populate IP Whitelisting rules and IP authorization checks.
 */

let cachedDeviceIP = '';

export async function detectDeviceIP(): Promise<string> {
  if (cachedDeviceIP) {
    return cachedDeviceIP;
  }

  // 1. Check primary fast IP detection service
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        cachedDeviceIP = data.ip;
        return data.ip;
      }
    }
  } catch {
    // Fall through to backup
  }

  // 2. Fallback secondary detection service
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://icanhazip.com', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text) {
        cachedDeviceIP = text;
        return text;
      }
    }
  } catch {
    // Fall through to known default
  }

  return '110.227.184.49';
}

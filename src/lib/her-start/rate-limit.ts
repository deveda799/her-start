// 限流状态模块：独立于 route.ts，避免 Next.js route 文件类型约束
const ipCalls = new Map<string, number[]>();
let daily = { day: new Date().toISOString().slice(0, 10), count: 0 };

export function checkRateLimit(ip: string, ipLimit: number, dailyLimit: number): boolean {
  const now = Date.now();
  const calls = (ipCalls.get(ip) ?? []).filter((time) => now - time < 3_600_000);
  const today = new Date().toISOString().slice(0, 10);
  if (daily.day !== today) daily = { day: today, count: 0 };
  return calls.length < ipLimit && daily.count < dailyLimit;
}

export function recordCall(ip: string) {
  const now = Date.now();
  const calls = (ipCalls.get(ip) ?? []).filter((time) => now - time < 3_600_000);
  calls.push(now);
  ipCalls.set(ip, calls);
  daily.count += 1;
}

/** 测试专用：重置限流状态。 */
export function _resetRateLimitForTests() {
  ipCalls.clear();
  daily = { day: new Date().toISOString().slice(0, 10), count: 0 };
}

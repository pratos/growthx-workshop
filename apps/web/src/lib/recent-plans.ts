// Plans this browser has opened, newest first. There is no index of plans yet, so home lists these; per device, best
// effort (private windows and cleared storage start empty). The id rule is the API's.
const KEY = 'greenhouse.recent-plans';
export const PLAN_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

export function recentPlans(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((p): p is string => typeof p === 'string' && PLAN_ID.test(p)).slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function rememberPlan(planId: string) {
  if (!PLAN_ID.test(planId)) return;
  try { localStorage.setItem(KEY, JSON.stringify([planId, ...recentPlans().filter((p) => p !== planId)].slice(0, 8))); } catch { /* storage off: nothing to remember */ }
}

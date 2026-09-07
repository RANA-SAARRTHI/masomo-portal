// In-memory login rate limiter. Good enough for a single-instance deployment;
// swap for a shared store (e.g. Redis) once running more than one server
// process, since this map does not survive a restart or scale beyond it.
const attempts = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function keyFor(identifier: string) {
  return identifier.toLowerCase().trim();
}

export function isLockedOut(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const entry = attempts.get(keyFor(identifier));
  if (!entry?.lockedUntil) return { locked: false };
  const now = Date.now();
  if (now < entry.lockedUntil) {
    return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  attempts.delete(keyFor(identifier));
  return { locked: false };
}

export function recordFailedAttempt(identifier: string): { locked: boolean; retryAfterSeconds?: number } {
  const key = keyFor(identifier);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return { locked: false };
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    attempts.set(key, entry);
    return { locked: true, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
  }
  attempts.set(key, entry);
  return { locked: false };
}

export function clearAttempts(identifier: string) {
  attempts.delete(keyFor(identifier));
}

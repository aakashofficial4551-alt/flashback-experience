// Resolves with `fallback` if the promise takes longer than `ms` (or fails). Never rejects.
export function withTimeout(promise, ms, fallback = null) {
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(fallback), ms); });
  return Promise.race([Promise.resolve(promise).catch(() => fallback), timeout]).finally(() => clearTimeout(timer));
}

// A response cache keyed by a hash of the input.
//
// Two reasons it exists, in order of importance:
//   1. The recorded demo has to be repeatable. Running the wow step twice with
//      the same signal must render the same explanation, or the take is wasted.
//   2. The same signal evaluated twice inside one round should not be billed
//      twice.
//
// Module scope Map, no filesystem, no eviction beyond a size cap. A cold server
// instance starts empty, which is correct: the cache is an optimization, never
// a source of truth.

/** FNV style string hash. Not cryptographic, and it does not need to be. */
export function hashInput(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const MAX_ENTRIES = 64;
const store = new Map<string, unknown>();

export function cacheGet<T>(key: string): T | null {
  return store.has(key) ? (store.get(key) as T) : null;
}

export function cacheSet<T>(key: string, value: T): T {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (!oldest.done) store.delete(oldest.value);
  }
  store.set(key, value);
  return value;
}

export function cacheSize(): number {
  return store.size;
}

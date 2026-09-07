/**
 * Canonical JSON serialization (SC-10).
 *
 * Object keys are sorted, arrays keep their order, `undefined` members are
 * dropped, and no whitespace is emitted. Two structurally equal values always
 * produce byte-identical strings, which is what run identity and replay
 * comparison rely on.
 */
export function canonical(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('canonical: non-finite number');
      if (Object.is(value, -0)) return '0';
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((v) => canonical(v)).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}

/** Deep clone through canonical JSON — drops undefined, keeps everything else. */
export function cloneDeep<T>(value: T): T {
  return JSON.parse(canonical(value)) as T;
}

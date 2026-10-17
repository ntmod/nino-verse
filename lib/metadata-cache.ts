// Browser-only, account-scoped promises deduplicate both pending and completed reads.
const requests = new Map<string, Promise<unknown>>();
export function cachedMetadata<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (typeof window === 'undefined') return load();
  const existing = requests.get(key);
  if (existing) return existing as Promise<T>;
  const request = load().catch(error => {
    if (requests.get(key) === request) requests.delete(key);
    throw error;
  });
  requests.set(key, request);
  return request;
}
export function clearMetadataCache(prefix = '') {
  for (const key of requests.keys()) if (key.startsWith(prefix)) requests.delete(key);
}

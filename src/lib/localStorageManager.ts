// Centralized localStorage manager with TTL support
export interface CacheItem<T> {
  value: T;
  expiry: number | null;
}

export function setItem<T>(key: string, value: T, ttlMinutes?: number) {
  const item: CacheItem<T> = {
    value,
    expiry: ttlMinutes ? Date.now() + ttlMinutes * 60000 : null,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getItem<T>(key: string): T | null {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item: CacheItem<T> = JSON.parse(itemStr);
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function removeItem(key: string) {
  localStorage.removeItem(key);
}

export function clearUserData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith('quiz-') ||
        key.startsWith('session-') ||
        key === 'userData' ||
        key === 'quiz-responses' ||
        key === 'joinedPolls' ||
        key === 'pollCodeMapping')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(removeItem);
} 
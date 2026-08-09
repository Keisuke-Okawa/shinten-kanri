export type UrgencySettings = {
  redDays: number;
  yellowDays: number;
};

export const DEFAULT_URGENCY_SETTINGS: UrgencySettings = {
  redDays: 3,
  yellowDays: 7,
};

const STORAGE_KEY = "urgencySettings";

// useSyncExternalStore 用のリスナー管理（同一タブでの変更を通知する）
let urgencyListeners: Array<() => void> = [];

export function subscribeUrgency(listener: () => void): () => void {
  urgencyListeners = [...urgencyListeners, listener];
  window.addEventListener("storage", listener);
  return () => {
    urgencyListeners = urgencyListeners.filter((l) => l !== listener);
    window.removeEventListener("storage", listener);
  };
}

// useSyncExternalStore の getSnapshot はオブジェクトの同一参照を返す必要がある。
// データが変わっていない限り同じ参照を返すようにキャッシュする。
let cachedUrgencyRaw: string | null = null;
let cachedUrgencyValue: UrgencySettings = DEFAULT_URGENCY_SETTINGS;

export function loadUrgencySettings(): UrgencySettings {
  if (typeof window === "undefined") return DEFAULT_URGENCY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedUrgencyRaw) return cachedUrgencyValue;
    cachedUrgencyRaw = raw;
    if (!raw) {
      cachedUrgencyValue = DEFAULT_URGENCY_SETTINGS;
      return cachedUrgencyValue;
    }
    const parsed = JSON.parse(raw) as Partial<UrgencySettings>;
    const redDays =
      typeof parsed.redDays === "number" && parsed.redDays >= 1
        ? parsed.redDays
        : DEFAULT_URGENCY_SETTINGS.redDays;
    const yellowDays =
      typeof parsed.yellowDays === "number" && parsed.yellowDays > redDays
        ? parsed.yellowDays
        : DEFAULT_URGENCY_SETTINGS.yellowDays;
    cachedUrgencyValue = { redDays, yellowDays };
    return cachedUrgencyValue;
  } catch {
    return DEFAULT_URGENCY_SETTINGS;
  }
}

export function saveUrgencySettings(s: UrgencySettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  cachedUrgencyRaw = null; // キャッシュ無効化（次回読み込み時に再パース）
  urgencyListeners.forEach((l) => l());
}

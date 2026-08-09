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

export function loadUrgencySettings(): UrgencySettings {
  if (typeof window === "undefined") return DEFAULT_URGENCY_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_URGENCY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<UrgencySettings>;
    const redDays =
      typeof parsed.redDays === "number" && parsed.redDays >= 1
        ? parsed.redDays
        : DEFAULT_URGENCY_SETTINGS.redDays;
    const yellowDays =
      typeof parsed.yellowDays === "number" && parsed.yellowDays > redDays
        ? parsed.yellowDays
        : DEFAULT_URGENCY_SETTINGS.yellowDays;
    return { redDays, yellowDays };
  } catch {
    return DEFAULT_URGENCY_SETTINGS;
  }
}

export function saveUrgencySettings(s: UrgencySettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // 同一タブのリスナーに変更を通知
  urgencyListeners.forEach((l) => l());
}

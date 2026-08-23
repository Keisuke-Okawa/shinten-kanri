/**
 * タスクの期日自動計算設定。
 * 各タスク名に対して「基準日の種類」と「何日前（正）/ 何日後（負）」を持つ。
 * localStorage に保存し、urgencySettings と同パターンで読み書きする。
 */

import { formatISODate, parseISODate } from "@/lib/computed/profile";

// 基準日の種類
export type DueDateReference = "openDate" | "firstDeliveryDate";

// タスク1件の設定
export type TaskDueDateOffset = {
  reference: DueDateReference;
  days: number; // 正 = 基準日より前、負 = 基準日より後
};

// 全タスクの設定マップ（キー = タスク名、null = 自動設定しない）
export type TaskDueDateOffsets = Record<string, TaskDueDateOffset | null>;

export const DEFAULT_TASK_DUE_DATE_OFFSETS: TaskDueDateOffsets = {
  // ── オープン日基準 ──
  祝花手配: { reference: "openDate", days: 3 },
  雑瓶対応: { reference: "openDate", days: 10 },
  コード作成: { reference: "openDate", days: 9 },
  協賛対応: { reference: "openDate", days: 5 },
  協賛支払い: { reference: "openDate", days: -7 }, // 7日後
  企業調査: { reference: "openDate", days: 14 },
  契約書: { reference: "openDate", days: 14 },
  飲食訪問: { reference: "openDate", days: 20 },
  飲食同行精算: { reference: "openDate", days: -5 }, // 5日後
  // ── 初回納品日基準 ──
  新規コード作成: { reference: "firstDeliveryDate", days: 5 },
  "鍵預かり・キーボックス": { reference: "firstDeliveryDate", days: 3 },
  初回納品確認: { reference: "firstDeliveryDate", days: 7 },
  WEB設定: { reference: "firstDeliveryDate", days: 3 },
  号車報告書: { reference: "firstDeliveryDate", days: 3 },
  代配手配: { reference: "firstDeliveryDate", days: 14 },
};

const STORAGE_KEY = "taskDueDateOffsets";

// useSyncExternalStore 用のリスナー管理（同一タブでの変更を通知する）
let dueDateListeners: Array<() => void> = [];

export function subscribeDueDateOffsets(listener: () => void): () => void {
  dueDateListeners = [...dueDateListeners, listener];
  window.addEventListener("storage", listener);
  return () => {
    dueDateListeners = dueDateListeners.filter((l) => l !== listener);
    window.removeEventListener("storage", listener);
  };
}

// useSyncExternalStore の getSnapshot はオブジェクトの同一参照を返す必要がある。
// データが変わっていない限り同じ参照を返すようにキャッシュする。
let cachedDueDateRaw: string | null = null;
let cachedDueDateValue: TaskDueDateOffsets = DEFAULT_TASK_DUE_DATE_OFFSETS;

export function loadTaskDueDateOffsets(): TaskDueDateOffsets {
  if (typeof window === "undefined") return DEFAULT_TASK_DUE_DATE_OFFSETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedDueDateRaw) return cachedDueDateValue;
    cachedDueDateRaw = raw;
    if (!raw) {
      cachedDueDateValue = DEFAULT_TASK_DUE_DATE_OFFSETS;
      return cachedDueDateValue;
    }
    const parsed = JSON.parse(raw) as TaskDueDateOffsets;
    cachedDueDateValue = { ...DEFAULT_TASK_DUE_DATE_OFFSETS, ...parsed };
    return cachedDueDateValue;
  } catch {
    return DEFAULT_TASK_DUE_DATE_OFFSETS;
  }
}

export function saveTaskDueDateOffsets(s: TaskDueDateOffsets): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  cachedDueDateRaw = null; // キャッシュ無効化（次回読み込み時に再パース）
  dueDateListeners.forEach((l) => l());
}

/**
 * "M/D" 形式の文字列を Date に変換する。
 * 年は「今日以前なら翌年、未来なら今年」と推定する。
 */
function parseMDDate(s: string): Date | undefined {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return undefined;
  const month = parseInt(m[1], 10) - 1;
  const day = parseInt(m[2], 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return undefined;
  const today = new Date();
  let year = today.getFullYear();
  const candidate = new Date(year, month, day);
  if (candidate.getTime() < today.getTime()) year += 1;
  return new Date(year, month, day);
}

/**
 * 基準日文字列（YYYY-MM-DD または M/D）とオフセット日数から期日を計算する。
 * days > 0 → 基準日の days 日前
 * days < 0 → 基準日の |days| 日後
 * days = 0 → 基準日当日
 * パースできない形式の場合は "" を返す（例外を投げない）。
 */
export function computeTaskDueDate(referenceDate: string, days: number): string {
  const d = parseISODate(referenceDate) ?? parseMDDate(referenceDate);
  if (!d) return "";
  d.setDate(d.getDate() - days);
  return formatISODate(d);
}

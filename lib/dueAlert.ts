import { type Store, type TrafficLight } from "@/lib/schema";
import {
  deriveTrafficLight,
  getDisplayTaskStatus,
} from "@/lib/computed/tasks";
import { DEFAULT_URGENCY_SETTINGS } from "@/lib/urgencySettings";
import { TRAFFIC_LIGHT_LABELS } from "@/lib/labels";

/** 通知は画面の初期値（赤3日・黄7日）で固定する */
export const DUE_ALERT_URGENCY = DEFAULT_URGENCY_SETTINGS;

/** メール本文に載せる上限。超過分は件数だけ示す */
export const DUE_ALERT_MAX_LISTED = 15;

export type DueAlertItem = {
  storeName: string;
  taskName: string;
  dueDate: string;
  trafficLight: Extract<TrafficLight, "red" | "yellow">;
};

export type DueAlertDigest = {
  items: DueAlertItem[];
  redCount: number;
  yellowCount: number;
  extraCount: number;
};

const LIGHT_RANK: Record<"red" | "yellow", number> = {
  red: 0,
  yellow: 1,
};

/** Asia/Tokyo のカレンダー日を、日付計算用のローカル Date にする */
export function getJstCalendarDate(now = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isJstWeekend(now = new Date()): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(now);
  return weekday === "Sat" || weekday === "Sun";
}

export function collectDueAlertItems(
  stores: Store[],
  today = getJstCalendarDate(),
): DueAlertDigest {
  const all: DueAlertItem[] = [];

  for (const store of stores) {
    if (store.status === "completed") continue;

    for (const task of store.tasks) {
      const displayStatus = getDisplayTaskStatus(task, store.profile);
      const light = deriveTrafficLight(
        task.dueDate,
        displayStatus,
        DUE_ALERT_URGENCY,
        today,
      );
      if (light !== "red" && light !== "yellow") continue;

      all.push({
        storeName: store.profile.name.trim() || "（店名なし）",
        taskName: task.name,
        dueDate: task.dueDate,
        trafficLight: light,
      });
    }
  }

  all.sort((a, b) => {
    const lightDiff = LIGHT_RANK[a.trafficLight] - LIGHT_RANK[b.trafficLight];
    if (lightDiff !== 0) return lightDiff;
    const dueDiff = a.dueDate.localeCompare(b.dueDate);
    if (dueDiff !== 0) return dueDiff;
    return a.storeName.localeCompare(b.storeName, "ja");
  });

  const redCount = all.filter((item) => item.trafficLight === "red").length;
  const yellowCount = all.length - redCount;

  return {
    items: all.slice(0, DUE_ALERT_MAX_LISTED),
    redCount,
    yellowCount,
    extraCount: Math.max(0, all.length - DUE_ALERT_MAX_LISTED),
  };
}

export function formatDueAlertSubject(
  digest: DueAlertDigest,
  options: { isTest: boolean },
): string {
  if (digest.redCount === 0 && digest.yellowCount === 0) {
    return "【新店】テスト: 対象なし";
  }
  const counts = `赤${digest.redCount} 黄${digest.yellowCount}`;
  return options.isTest ? `【新店】テスト ${counts}` : `【新店】${counts}`;
}

function formatMonthDayFromIso(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return iso;
  return `${Number(match[2])}/${Number(match[3])}`;
}

function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatItemLine(item: DueAlertItem): string {
  return `・${item.storeName} ${item.taskName} 〜${formatMonthDayFromIso(item.dueDate)}`;
}

export function getDueAlertAppUrl(): string {
  const explicit = process.env.DUE_ALERT_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return "";
}

export function formatDueAlertText(
  digest: DueAlertDigest,
  options: { isTest: boolean; today?: Date; appUrl?: string },
): string {
  const today = options.today ?? getJstCalendarDate();
  const appUrl = options.appUrl ?? getDueAlertAppUrl();
  const appLink = appUrl ? `${appUrl}/workspace/shinten` : "";
  const lines: string[] = [];

  if (options.isTest) {
    lines.push("テスト送信です。");
    lines.push("");
  }

  if (digest.redCount === 0 && digest.yellowCount === 0) {
    lines.push("今、赤・黄の未完了タスクはありません。");
    if (options.isTest) {
      lines.push("本番の毎朝通知では、この場合はメールを送りません。");
    }
    if (appLink) {
      lines.push("");
      lines.push(appLink);
    }
    return lines.join("\n");
  }

  lines.push(`【期日アラート ${formatMonthDay(today)}】`);
  lines.push(`赤 ${digest.redCount}件 / 黄 ${digest.yellowCount}件`);

  const redItems = digest.items.filter((item) => item.trafficLight === "red");
  const yellowItems = digest.items.filter((item) => item.trafficLight === "yellow");

  if (redItems.length > 0) {
    lines.push("");
    lines.push(`■ ${TRAFFIC_LIGHT_LABELS.red}`);
    for (const item of redItems) {
      lines.push(formatItemLine(item));
    }
  }

  if (yellowItems.length > 0) {
    lines.push("");
    lines.push(`■ ${TRAFFIC_LIGHT_LABELS.yellow}`);
    for (const item of yellowItems) {
      lines.push(formatItemLine(item));
    }
  }

  if (digest.extraCount > 0) {
    lines.push("");
    lines.push(`他${digest.extraCount}件はアプリで確認してください。`);
  }

  if (appLink) {
    lines.push("");
    lines.push(appLink);
  }

  return lines.join("\n");
}

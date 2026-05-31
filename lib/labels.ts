/**
 * 新店舗オープン管理の表示文言。
 */

import {
  type StoreStatusKey,
  type TaskStatusKey,
  type TrafficLight,
} from "@/lib/schema";

export const STORE_STATUS_LABELS: Record<StoreStatusKey, string> = {
  notStarted: "未着手",
  inProgress: "進行中",
  completed: "完了",
};

export const TASK_STATUS_LABELS: Record<TaskStatusKey, string> = {
  notStarted: "未着手",
  inProgress: "進行中",
  completed: "完了",
  na: "対象外",
};

export const TRAFFIC_LIGHT_LABELS: Record<TrafficLight, string> = {
  green: "順調",
  yellow: "期日迫る",
  red: "緊急",
};

export const PANE2_SECTION = {
  basic: "基本情報",
  conditions: "条件設定",
  memo: "メモ",
} as const;

export const PANE3_SECTION = {
  taskList: "タスク一覧",
  taskListDescription: "期日と進捗を確認",
} as const;

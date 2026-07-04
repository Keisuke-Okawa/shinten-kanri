/**
 * 新店舗追加時のデフォルトタスク生成。
 * 酒の森品川店（s1）のタスク構成をテンプレートとし、
 * 新しい storeId で ID を採番し直して返す。
 */

import { type Task, type TaskKind } from "@/lib/schema";

type SubTaskTemplate = {
  name: string;
  completed: boolean;
  requiresMiscBottle?: boolean;
  pinBottom?: boolean;
};

type TaskTemplate = {
  name: string;
  kind: TaskKind;
  subtasks?: SubTaskTemplate[];
  requiresWebOrder?: boolean;
  requiresProxyDelivery?: boolean;
  requiresCongratulatoryFlowers?: boolean;
  requiresKeyCustody?: boolean;
  requiresSponsorship?: boolean;
  requiresNewStore?: boolean;
  requiresMiscBottle?: boolean;
};

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: "号車報告書",
    kind: "vehicleReport",
  },
  {
    name: "WEB設定",
    kind: "standard",
    requiresWebOrder: true,
  },
  {
    name: "祝花手配",
    kind: "standard",
    requiresCongratulatoryFlowers: true,
    subtasks: [{ name: "決裁取得", completed: false }],
  },
  {
    name: "鍵預かり・キーボックス",
    kind: "standard",
    requiresKeyCustody: true,
  },
  {
    name: "初回納品確認",
    kind: "standard",
  },
  {
    name: "代配手配",
    kind: "standard",
    requiresProxyDelivery: true,
  },
  {
    name: "コード作成",
    kind: "standard",
    subtasks: [
      { name: "エビデンス取得", completed: false },
      { name: "雑瓶エビデンス取得", completed: false, requiresMiscBottle: true },
      { name: "コード作成申請", completed: false, pinBottom: true },
    ],
  },
  {
    name: "協賛対応",
    kind: "standard",
    requiresSponsorship: true,
    subtasks: [
      { name: "条件取り決め", completed: false },
      { name: "決裁取得", completed: false },
      { name: "協賛契約書作成", completed: false },
      { name: "請求書発行依頼", completed: false },
      { name: "先方捺印", completed: false },
    ],
  },
  {
    name: "協賛支払い",
    kind: "standard",
    requiresSponsorship: true,
    subtasks: [
      { name: "支払い申請・納品", completed: false },
      { name: "押印申請", completed: false },
      { name: "協賛契約書返却", completed: false },
    ],
  },
  {
    name: "企業調査",
    kind: "standard",
    requiresNewStore: true,
  },
  {
    name: "契約書",
    kind: "standard",
    requiresNewStore: true,
    subtasks: [
      { name: "雑瓶取り決め", completed: false },
      { name: "契約書提出", completed: false },
      { name: "契約書捺印", completed: false },
    ],
  },
  {
    name: "新規コード作成",
    kind: "standard",
    requiresNewStore: true,
    subtasks: [
      { name: "経営者コード作成", completed: false },
      { name: "新規コード作成", completed: false },
    ],
  },
  {
    name: "雑瓶対応",
    kind: "standard",
    requiresMiscBottle: true,
  },
];

export function generateDefaultTasks(storeId: string): Task[] {
  return TASK_TEMPLATES.map((tmpl, i) => {
    const taskId = `${storeId}-t${i + 1}`;
    const subtasks = tmpl.subtasks?.map((sub, j) => ({
      id: `${taskId}-s${j + 1}`,
      name: sub.name,
      completed: sub.completed,
      ...(sub.requiresMiscBottle !== undefined
        ? { requiresMiscBottle: sub.requiresMiscBottle }
        : {}),
      ...(sub.pinBottom !== undefined ? { pinBottom: sub.pinBottom } : {}),
    }));

    return {
      id: taskId,
      name: tmpl.name,
      kind: tmpl.kind,
      status: "notStarted",
      dueDate: "",
      ...(subtasks ? { subtasks } : {}),
      ...(tmpl.requiresWebOrder ? { requiresWebOrder: true } : {}),
      ...(tmpl.requiresProxyDelivery ? { requiresProxyDelivery: true } : {}),
      ...(tmpl.requiresCongratulatoryFlowers
        ? { requiresCongratulatoryFlowers: true }
        : {}),
      ...(tmpl.requiresKeyCustody ? { requiresKeyCustody: true } : {}),
      ...(tmpl.requiresSponsorship ? { requiresSponsorship: true } : {}),
      ...(tmpl.requiresNewStore ? { requiresNewStore: true } : {}),
      ...(tmpl.requiresMiscBottle ? { requiresMiscBottle: true } : {}),
    };
  });
}

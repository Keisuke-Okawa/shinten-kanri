/**
 * 新店舗オープン進捗管理ドメインの Zod スキーマと派生型。
 * 雛形の SSoT として、UI コンポーネントはここから型をインポートする。
 */

import { z } from "zod";

// ===== 店舗ステータス（Pane 1 グループ） =====

export const storeStatusKeySchema = z.enum([
  "notStarted",
  "inProgress",
  "completed",
]);
export type StoreStatusKey = z.infer<typeof storeStatusKeySchema>;

export const STORE_STATUS_ORDER: StoreStatusKey[] = [
  "inProgress",
  "notStarted",
  "completed",
];

// ===== タスクステータス（Pane 3） =====

export const taskStatusKeySchema = z.enum([
  "notStarted",
  "inProgress",
  "completed",
  "na",
]);
export type TaskStatusKey = z.infer<typeof taskStatusKeySchema>;

// ===== 信号機（期日インジケーター） =====

export const trafficLightSchema = z.enum(["green", "yellow", "red"]);
export type TrafficLight = z.infer<typeof trafficLightSchema>;

// ===== タスク種別 =====

export const taskKindSchema = z.enum(["standard", "vehicleReport"]);
export type TaskKind = z.infer<typeof taskKindSchema>;

// ===== 店舗プロフィール（Pane 2 / 号車報告書） =====

export const storeProfileSchema = z.object({
  customerCode: z.string(),
  name: z.string(),
  companyName: z.string(),
  businessType: z.string(),
  address: z.string(),
  phone: z.string(),
  managerName: z.string(),
  paymentMethod: z.string(),
  collectionPerson: z.string(),
  deliveryTimeStart: z.string(),
  deliveryTimeEnd: z.string(),
  hasLunch: z.boolean(),
  orderMethod: z.string(),
  holidays: z.string(),
  miscCollection: z.boolean(),
  miscCollectionStart: z.string(),
  firstDeliveryDate: z.string(),
  openDate: z.string(),
  smokingPolicy: z.string(),
  deliveryNotes: z.string(),
  specialNotes: z.string(),
  invoiceType: z.string(),
  serverInstallDate: z.string(),
  handoverDate: z.string(),
  accountChangeEmptyReturn: z.boolean(),
  elevatorAvailable: z.boolean(),
  dedicatedEntrance: z.boolean(),
  notesAndAttachments: z.string(),
  seatCount: z.string(),
  avgSpendPerCustomer: z.string(),
  expectedSales: z.string(),
  // 条件付きタスク連動トグル
  webOrder: z.boolean(),
  sponsorship: z.boolean(),
  newStore: z.boolean(),
  miscBottle: z.boolean(),
  keyCustody: z.boolean(),
  congratulatoryFlowers: z.boolean(),
  proxyDelivery: z.boolean(),
  customerWorkStartWeekday: z.string(),
  customerWorkEndWeekday: z.string(),
  customerWorkStartWeekend: z.string(),
  customerWorkEndWeekend: z.string(),
  pane2Memo: z.string(),
});
export type StoreProfile = z.infer<typeof storeProfileSchema>;

// ===== 子タスク =====

export const subTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean(),
  requiresMiscBottle: z.boolean().optional(),
  pinBottom: z.boolean().optional(),
});
export type SubTask = z.infer<typeof subTaskSchema>;

// ===== タスク =====

export const taskSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: taskKindSchema,
  status: taskStatusKeySchema,
  dueDate: z.string(),
  memo: z.string().optional(),
  subtasks: z.array(subTaskSchema).optional(),
  // 表示条件（プロフィール連動）
  requiresWebOrder: z.boolean().optional(),
  requiresProxyDelivery: z.boolean().optional(),
  requiresCongratulatoryFlowers: z.boolean().optional(),
  requiresKeyCustody: z.boolean().optional(),
  requiresSponsorship: z.boolean().optional(),
  requiresNewStore: z.boolean().optional(),
  requiresMiscBottle: z.boolean().optional(),
});
export type Task = z.infer<typeof taskSchema>;

// ===== 店舗 =====

export const storeSchema = z.object({
  id: z.string(),
  status: storeStatusKeySchema,
  profile: storeProfileSchema,
  tasks: z.array(taskSchema),
});
export type Store = z.infer<typeof storeSchema>;

// ===== JSON 全体用スキーマ =====

export const storesSchema = z.array(storeSchema);
export const workspaceSchema = z.object({
  name: z.string(),
  icon: z.string(),
});

// ===== Pane 1 の派生表示型 =====

export type StoreRow = {
  id: string;
  name: string;
  openDate: string;
  progressPercent: number;
  storeTrafficLight: TrafficLight;
  autoCompleted: boolean;
};

export type StoreGroup = {
  status: StoreStatusKey;
  label: string;
  items: StoreRow[];
};

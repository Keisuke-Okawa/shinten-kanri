import {
  type Store,
  type StoreProfile,
  type StoreStatusKey,
  type SubTask,
  type Task,
  type TaskStatusKey,
  type TrafficLight,
} from "@/lib/schema";

/** 配送開始時刻が出勤時刻より前なら鍵タスクが必要 */
export function needsKeyCustody(profile: StoreProfile): boolean {
  const deliveryStart = parseTime(profile.deliveryTimeStart);
  const workStart = parseTime(profile.customerWorkStartWeekday);
  if (deliveryStart === null || workStart === null) return false;
  return deliveryStart < workStart;
}

function parseTime(time: string): number | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** プロフィール条件に基づきタスクが対象か判定 */
export function isTaskApplicable(task: Task, profile: StoreProfile): boolean {
  if (task.requiresWebOrder && !profile.webOrder) return false;
  if (task.requiresProxyDelivery && !profile.proxyDelivery) return false;
  if (task.requiresCongratulatoryFlowers && !profile.congratulatoryFlowers)
    return false;
  if (task.requiresKeyCustody && !needsKeyCustody(profile) && !profile.keyCustody) return false;
  return true;
}

/** プロフィール条件に基づき表示すべき子タスクを返す */
export function getVisibleSubtasks(
  subtasks: SubTask[] | undefined,
  profile: StoreProfile,
): SubTask[] {
  if (!subtasks) return [];
  return subtasks.filter((s) => !s.requiresMiscBottle || profile.miscBottle);
}

/** 表示用ステータス（対象外は na） */
export function getDisplayTaskStatus(
  task: Task,
  profile: StoreProfile,
): TaskStatusKey {
  if (!isTaskApplicable(task, profile)) return "na";
  return task.status;
}

const PROGRESS_RANK: Record<TaskStatusKey, number> = {
  inProgress: 0,
  notStarted: 1,
  completed: 2,
  na: 3,
};

const URGENCY_RANK: Record<TrafficLight, number> = {
  red: 0,
  yellow: 1,
  green: 2,
};

function getUrgencyRank(trafficLight: TrafficLight | null): number {
  if (trafficLight === null) return URGENCY_RANK.green + 1;
  return URGENCY_RANK[trafficLight];
}

/** Pane 3 表示用: 進行度 > 緊急度 で並べ替え */
export function compareTasksForDisplay(
  a: {
    displayStatus: TaskStatusKey;
    trafficLight: TrafficLight | null;
    dueDate: string;
  },
  b: {
    displayStatus: TaskStatusKey;
    trafficLight: TrafficLight | null;
    dueDate: string;
  },
): number {
  const progressDiff =
    PROGRESS_RANK[a.displayStatus] - PROGRESS_RANK[b.displayStatus];
  if (progressDiff !== 0) return progressDiff;

  const urgencyDiff =
    getUrgencyRank(a.trafficLight) - getUrgencyRank(b.trafficLight);
  if (urgencyDiff !== 0) return urgencyDiff;

  return a.dueDate.localeCompare(b.dueDate);
}

export function sortTasksForDisplay<
  T extends {
    displayStatus: TaskStatusKey;
    trafficLight: TrafficLight | null;
    dueDate: string;
  },
>(tasks: T[]): T[] {
  return [...tasks].sort(compareTasksForDisplay);
}

/** 期日から信号機を派生（完了・対象外は null） */
export function deriveTrafficLight(
  dueDate: string,
  status: TaskStatusKey,
  today = new Date(),
): TrafficLight | null {
  if (status === "completed" || status === "na") return null;
  const due = parseDate(dueDate);
  if (!due) return null;

  const todayStart = startOfDay(today);
  const dueStart = startOfDay(due);
  const diffDays = Math.round(
    (dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "red";
  if (diffDays <= 3) return "red";
  if (diffDays <= 7) return "yellow";
  return "green";
}

function parseDate(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** 店舗の進捗率（対象タスクの完了割合） */
export function getStoreProgressPercent(store: Store): number {
  const applicable = store.tasks.filter((t) =>
    isTaskApplicable(t, store.profile),
  );
  if (applicable.length === 0) return 0;
  const done = applicable.filter((t) => t.status === "completed").length;
  return Math.round((done / applicable.length) * 100);
}

/** 店舗全体の代表信号機（最も緊急度が高い色） */
export function getStoreTrafficLight(
  store: Store,
  today = new Date(),
): TrafficLight {
  const lights = store.tasks
    .map((task) => {
      const status = getDisplayTaskStatus(task, store.profile);
      return deriveTrafficLight(task.dueDate, status, today);
    })
    .filter((l): l is TrafficLight => l !== null);

  if (lights.includes("red")) return "red";
  if (lights.includes("yellow")) return "yellow";
  return "green";
}

/** オープン日を過ぎて、対象タスクが全て完了していれば true（完了の強制ルール） */
export function shouldAutoComplete(store: Store, today = new Date()): boolean {
  const openDate = parseDate(store.profile.openDate);
  if (!openDate) return false;
  if (startOfDay(openDate) > startOfDay(today)) return false;
  const applicable = store.tasks.filter((t) =>
    isTaskApplicable(t, store.profile),
  );
  if (applicable.length === 0) return false;
  return applicable.every((t) => t.status === "completed");
}

/** 新規追加時のデフォルトステータスを導出（手動ドラッグ前の初期値） */
export function deriveStoreStatus(store: Store): StoreStatusKey {
  const applicable = store.tasks.filter((t) =>
    isTaskApplicable(t, store.profile),
  );
  if (applicable.some((t) => t.status === "inProgress")) return "inProgress";
  return "notStarted";
}

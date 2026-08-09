"use client";

/**
 * Workspace: 新店舗オープン進捗管理の 4 ペイン親コンポーネント。
 *
 * Pane 1: 店舗一覧（ステータス別グループ・ドラッグ移動）
 * Pane 2: 店舗プロフィール
 * Pane 3: タスク一覧（信号機 + ステータス）
 * Pane 4: タスク詳細 / 号車報告書フォーム
 */

import { useState, useCallback, useMemo, useEffect, useSyncExternalStore } from "react";

import {
  type Store,
  type StoreProfile,
  type StoreStatusKey,
  type Task,
  type TaskStatusKey,
  STORE_STATUS_ORDER,
} from "@/lib/schema";
import { generateDefaultTasks } from "@/lib/defaultTasks";
import { STORE_STATUS_LABELS } from "@/lib/labels";
import {
  deriveStoreStatus,
  deriveTrafficLight,
  getDisplayTaskStatus,
  getStoreProgressPercent,
  getStoreTrafficLight,
  getVisibleSubtasks,
  sortTasksForDisplay,
} from "@/lib/computed/tasks";
import {
  loadUrgencySettings,
  saveUrgencySettings,
  subscribeUrgency,
  type UrgencySettings,
  DEFAULT_URGENCY_SETTINGS,
} from "@/lib/urgencySettings";
import {
  BG_COLOR_PRESETS,
  getDefaultBgColorId,
  loadBgColorId,
  saveBgColorId,
  subscribeBgColor,
} from "@/lib/backgroundColorSettings";
import {
  computeTaskDueDate,
  DEFAULT_TASK_DUE_DATE_OFFSETS,
  loadTaskDueDateOffsets,
  saveTaskDueDateOffsets,
  subscribeDueDateOffsets,
  type TaskDueDateOffsets,
} from "@/lib/taskDueDateOffsets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GlobalHeader } from "@/components/workspace/GlobalHeader";
import { StoreListPane } from "@/components/workspace/StoreListPane";
import { StoreProfilePane } from "@/components/workspace/StoreProfilePane";
import { TaskListPane } from "@/components/workspace/TaskListPane";
import { TaskDetailPane } from "@/components/workspace/TaskDetailPane";

type WorkspaceProps = {
  initialStores: Store[];
  workspace: { name: string; icon: string };
  onSaveStoreStatus?: (storeId: string, status: StoreStatusKey) => Promise<void>;
  onSaveTaskStatus?: (taskId: string, status: TaskStatusKey) => Promise<void>;
  onToggleSubtask?: (subtaskId: string, completed: boolean) => Promise<void>;
  onSaveProfile?: (storeId: string, profile: StoreProfile) => Promise<void>;
  onSaveTaskDetail?: (taskId: string, memo: string, dueDate: string) => Promise<void>;
  onAddStore?: (id: string, profile: StoreProfile) => Promise<void>;
  onDeleteStore?: (id: string) => Promise<void>;
};

export function Workspace({
  initialStores,
  workspace,
  onSaveStoreStatus,
  onSaveTaskStatus,
  onToggleSubtask,
  onSaveProfile,
  onSaveTaskDetail,
  onAddStore,
  onDeleteStore,
}: WorkspaceProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("s1");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1-1");
  const [pane4ManuallyClosed, setPane4ManuallyClosed] = useState(false);
  // useSyncExternalStore で localStorage を購読:
  //   - getServerSnapshot: SSR 時（localStorage なし）はデフォルト値
  //   - getSnapshot: クライアント側で localStorage から読む
  //   - subscribe: 同一タブ（save 関数）・別タブ（storage イベント）の変更を検知
  const urgencySettings = useSyncExternalStore(
    subscribeUrgency,
    loadUrgencySettings,
    () => DEFAULT_URGENCY_SETTINGS,
  );
  const bgColorId = useSyncExternalStore(
    subscribeBgColor,
    loadBgColorId,
    getDefaultBgColorId,
  );
  const taskDueDateOffsets = useSyncExternalStore(
    subscribeDueDateOffsets,
    loadTaskDueDateOffsets,
    () => DEFAULT_TASK_DUE_DATE_OFFSETS,
  );
  // オープン日 or 初回納品日変更時の確認ダイアログ用
  const [pendingDateChange, setPendingDateChange] = useState<{
    field: "openDate" | "firstDeliveryDate";
    newDate: string;
  } | null>(null);

  // 日付変化で信号機を再計算するため、今日の日付を state で管理する
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    function tick() {
      const now = new Date();
      setToday((prev) => {
        if (
          prev.getFullYear() === now.getFullYear() &&
          prev.getMonth() === now.getMonth() &&
          prev.getDate() === now.getDate()
        ) {
          return prev;
        }
        return now;
      });
    }
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleSaveUrgencySettings = useCallback((s: UrgencySettings) => {
    saveUrgencySettings(s); // 保存 + リスナー通知 → useSyncExternalStore が自動再レンダリング
  }, []);

  const handleSaveBgColor = useCallback((id: string) => {
    saveBgColorId(id);
  }, []);

  const handleSaveTaskDueDateOffsets = useCallback((s: TaskDueDateOffsets) => {
    saveTaskDueDateOffsets(s);
  }, []);

  const activeStore =
    stores.find((s) => s.id === selectedStoreId) ?? stores[0];

  const pane4Open = selectedTaskId !== null && !pane4ManuallyClosed;

  const setProfile = useCallback<React.Dispatch<React.SetStateAction<StoreProfile>>>(
    (action) => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== selectedStoreId) return s;
          const next =
            typeof action === "function" ? action(s.profile) : action;
          return { ...s, profile: next };
        }),
      );
    },
    [selectedStoreId],
  );

  const selectStore = useCallback((id: string) => {
    setSelectedStoreId(id);
    setSelectedTaskId(null);
    setPane4ManuallyClosed(false);
  }, []);

  const selectTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    setPane4ManuallyClosed(false);
  }, []);

  const updateTask = useCallback(
    (updates: Partial<Task>) => {
      if (!selectedTaskId) return;

      // タスクステータス変更を DB に反映
      if (updates.status !== undefined) {
        void onSaveTaskStatus?.(selectedTaskId, updates.status);
      }

      // メモ・期日変更を DB に反映
      if (updates.memo !== undefined || updates.dueDate !== undefined) {
        const currentTask = stores
          .find((s) => s.id === selectedStoreId)
          ?.tasks.find((t) => t.id === selectedTaskId);
        const newMemo = updates.memo ?? currentTask?.memo ?? "";
        const newDueDate = updates.dueDate ?? currentTask?.dueDate ?? "";
        void onSaveTaskDetail?.(selectedTaskId, newMemo, newDueDate);
      }

      // サブタスクの completed 変更を検知して DB に反映
      if (updates.subtasks !== undefined && onToggleSubtask) {
        setStores((prev) => {
          const currentTask = prev
            .find((s) => s.id === selectedStoreId)
            ?.tasks.find((t) => t.id === selectedTaskId);
          if (currentTask?.subtasks) {
            for (const updatedSub of updates.subtasks!) {
              const original = currentTask.subtasks!.find((sub) => sub.id === updatedSub.id);
              if (original && original.completed !== updatedSub.completed) {
                void onToggleSubtask(updatedSub.id, updatedSub.completed);
              }
            }
          }
          return prev.map((s) => {
            if (s.id !== selectedStoreId) return s;
            return {
              ...s,
              tasks: s.tasks.map((t) => {
                if (t.id !== selectedTaskId) return t;
                const hiddenSubtasks = t.subtasks?.filter(
                  (sub) => sub.requiresMiscBottle && !s.profile.miscBottle,
                ) ?? [];
                return {
                  ...t,
                  ...updates,
                  subtasks: [...updates.subtasks!, ...hiddenSubtasks],
                };
              }),
            };
          });
        });
        return;
      }

      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== selectedStoreId) return s;
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              if (t.id !== selectedTaskId) return t;
              if (updates.subtasks !== undefined && t.subtasks) {
                const hiddenSubtasks = t.subtasks.filter(
                  (sub) => sub.requiresMiscBottle && !s.profile.miscBottle,
                );
                return {
                  ...t,
                  ...updates,
                  subtasks: [...updates.subtasks, ...hiddenSubtasks],
                };
              }
              return { ...t, ...updates };
            }),
          };
        }),
      );
    },
    [selectedStoreId, selectedTaskId, stores, onSaveTaskStatus, onSaveTaskDetail, onToggleSubtask],
  );

  const addTask = useCallback(
    (taskData: Omit<Task, "id">) => {
      const id = `${selectedStoreId}-${Date.now()}`;
      setStores((prev) =>
        prev.map((s) =>
          s.id === selectedStoreId
            ? { ...s, tasks: [...s.tasks, { id, ...taskData }] }
            : s,
        ),
      );
    },
    [selectedStoreId],
  );

  const addStore = useCallback(
    (profile: StoreProfile) => {
      const id = `s-${Date.now()}`;
      const rawTasks = generateDefaultTasks(id);
      // 新規店舗追加時、オープン日 or 初回納品日が入力済みならオフセット設定を適用
      const tasks = rawTasks.map((t) => {
        const cfg = taskDueDateOffsets[t.name];
        if (!cfg) return t;
        const ref = cfg.reference === "openDate" ? profile.openDate : profile.firstDeliveryDate;
        if (!ref) return t;
        return { ...t, dueDate: computeTaskDueDate(ref, cfg.days) };
      });
      const newStore: Store = { id, status: "notStarted", profile, tasks };
      setStores((prev) => [...prev, newStore]);
      selectStore(id);
      void onAddStore?.(id, profile);
    },
    [selectStore, onAddStore, taskDueDateOffsets],
  );

  const deleteStore = useCallback(
    (storeId: string) => {
      const remaining = stores.filter((s) => s.id !== storeId);
      if (storeId === selectedStoreId && remaining.length > 0) {
        selectStore(remaining[0].id);
      }
      setStores(remaining);
      void onDeleteStore?.(storeId);
    },
    [stores, selectedStoreId, selectStore, onDeleteStore],
  );

  // 対象店舗のタスク期日を openDate / firstDeliveryDate から一括計算して上書きする
  const applyDueDates = useCallback(
    (storeId: string, openDate: string, firstDeliveryDate: string) => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== storeId) return s;
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              const cfg = taskDueDateOffsets[t.name];
              if (!cfg) return t;
              const ref = cfg.reference === "openDate" ? openDate : firstDeliveryDate;
              if (!ref) return t;
              return { ...t, dueDate: computeTaskDueDate(ref, cfg.days) };
            }),
          };
        }),
      );
    },
    [taskDueDateOffsets],
  );

  // プロフィール変更を state と DB に反映
  const updateProfilePartial = useCallback(
    (updates: Partial<StoreProfile>) => {
      const currentStore = stores.find((s) => s.id === selectedStoreId);
      if (!currentStore) return;
      const currentProfile = currentStore.profile;
      const newProfile = { ...currentProfile, ...updates };
      setProfile(newProfile);
      void onSaveProfile?.(selectedStoreId, newProfile);

      // トグルが ON になったとき、対応タスクの dueDate が空なら自動設定する
      // プロフィールフラグ → 対応する Task の requiresXxx フラグのマッピング
      type ToggleKey = keyof Pick<
        StoreProfile,
        "webOrder" | "proxyDelivery" | "congratulatoryFlowers" | "keyCustody" | "sponsorship" | "newStore" | "miscBottle"
      >;
      const toggleToTaskFlag: Record<ToggleKey, keyof Task> = {
        webOrder: "requiresWebOrder",
        proxyDelivery: "requiresProxyDelivery",
        congratulatoryFlowers: "requiresCongratulatoryFlowers",
        keyCustody: "requiresKeyCustody",
        sponsorship: "requiresSponsorship",
        newStore: "requiresNewStore",
        miscBottle: "requiresMiscBottle",
      };
      const toggleKeys = Object.keys(toggleToTaskFlag) as ToggleKey[];
      const newlyActivated = toggleKeys.filter(
        (key) => updates[key] === true && !currentProfile[key],
      );
      if (newlyActivated.length === 0) return;

      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== selectedStoreId) return s;
          return {
            ...s,
            tasks: s.tasks.map((t) => {
              if (t.dueDate) return t; // 期日が既にあれば変更しない
              const isTargeted = newlyActivated.some(
                (key) => t[toggleToTaskFlag[key]],
              );
              if (!isTargeted) return t;
              const cfg = taskDueDateOffsets[t.name];
              if (!cfg) return t;
              const ref =
                cfg.reference === "openDate"
                  ? newProfile.openDate
                  : newProfile.firstDeliveryDate;
              if (!ref) return t;
              return { ...t, dueDate: computeTaskDueDate(ref, cfg.days) };
            }),
          };
        }),
      );
    },
    [selectedStoreId, stores, setProfile, onSaveProfile, taskDueDateOffsets],
  );

  // オープン日変更ハンドラ：既存値があれば確認ダイアログ経由
  const handleUpdateOpenDate = useCallback(
    (newDate: string) => {
      const currentStore = stores.find((s) => s.id === selectedStoreId);
      if (!currentStore) return;
      const currentOpenDate = currentStore.profile.openDate;
      if (currentOpenDate && currentOpenDate !== newDate) {
        setPendingDateChange({ field: "openDate", newDate });
      } else {
        updateProfilePartial({ openDate: newDate });
        const firstDeliveryDate = currentStore.profile.firstDeliveryDate;
        applyDueDates(selectedStoreId, newDate, firstDeliveryDate);
      }
    },
    [stores, selectedStoreId, updateProfilePartial, applyDueDates],
  );

  // 初回納品日変更ハンドラ：既存値があれば確認ダイアログ経由
  const handleUpdateFirstDeliveryDate = useCallback(
    (newDate: string) => {
      const currentStore = stores.find((s) => s.id === selectedStoreId);
      if (!currentStore) return;
      const currentFirstDeliveryDate = currentStore.profile.firstDeliveryDate;
      if (currentFirstDeliveryDate && currentFirstDeliveryDate !== newDate) {
        setPendingDateChange({ field: "firstDeliveryDate", newDate });
      } else {
        updateProfilePartial({ firstDeliveryDate: newDate });
        const openDate = currentStore.profile.openDate;
        applyDueDates(selectedStoreId, openDate, newDate);
      }
    },
    [stores, selectedStoreId, updateProfilePartial, applyDueDates],
  );

  const togglePane4 = useCallback(
    () => setPane4ManuallyClosed((v) => !v),
    [],
  );

  // 手動ドラッグによるグループ移動。自動分類が適用されるため表示には影響しない（DB 同期のみ）。
  // 完了に自動分類された店舗はドラッグ不可（autoCompleted=true で SortableStoreRow が disabled）。
  const moveStore = useCallback(
    (id: string, toStatus: StoreStatusKey) => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (deriveStoreStatus(s) === "completed") return s;
          return { ...s, status: toStatus };
        }),
      );
      void onSaveStoreStatus?.(id, toStatus);
    },
    [onSaveStoreStatus],
  );

  const storeGroups = useMemo(() => {
    return STORE_STATUS_ORDER.map((status) => ({
      status,
      label: STORE_STATUS_LABELS[status],
      items: stores
        .filter((s) => deriveStoreStatus(s) === status)
        .sort((a, b) =>
          a.profile.openDate.localeCompare(b.profile.openDate),
        )
        .map((s) => ({
          id: s.id,
          name: s.profile.name,
          openDate: s.profile.openDate,
          progressPercent: getStoreProgressPercent(s),
          storeTrafficLight: getStoreTrafficLight(s, urgencySettings, today),
          autoCompleted: deriveStoreStatus(s) === "completed",
        })),
    }));
  }, [stores, urgencySettings, today]);

  const taskRows = useMemo(() => {
    if (!activeStore) return [];
    return sortTasksForDisplay(
      activeStore.tasks.map((task) => {
        const displayStatus = getDisplayTaskStatus(task, activeStore.profile);
        return {
          ...task,
          subtasks: getVisibleSubtasks(task.subtasks, activeStore.profile),
          displayStatus,
          trafficLight: deriveTrafficLight(task.dueDate, displayStatus, urgencySettings, today),
        };
      }),
    );
  }, [activeStore, urgencySettings, today]);

  const selectedTask = useMemo(() => {
    if (!activeStore) return null;
    const task = activeStore.tasks.find((t) => t.id === selectedTaskId) ?? null;
    if (!task) return null;
    return {
      ...task,
      subtasks: getVisibleSubtasks(task.subtasks, activeStore.profile),
    };
  }, [activeStore, selectedTaskId]);

  // DB からデータが取得できなかった場合のフォールバック表示
  if (!activeStore) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">データを読み込んでいます...</p>
      </div>
    );
  }

  const bgPreset =
    BG_COLOR_PRESETS.find((p) => p.id === bgColorId) ?? BG_COLOR_PRESETS[0];

  const confirmLabel =
    pendingDateChange?.field === "openDate" ? "オープン日" : "初回納品日";

  return (
    <>
      <AlertDialog open={pendingDateChange !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タスクの期日を更新しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmLabel}
              が変更されました。各タスクの期日を自動で再計算します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                if (!pendingDateChange) return;
                updateProfilePartial({ [pendingDateChange.field]: pendingDateChange.newDate });
                setPendingDateChange(null);
              }}
            >
              いいえ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDateChange) return;
                const currentStore = stores.find((s) => s.id === selectedStoreId);
                if (!currentStore) return;
                updateProfilePartial({ [pendingDateChange.field]: pendingDateChange.newDate });
                const openDate =
                  pendingDateChange.field === "openDate"
                    ? pendingDateChange.newDate
                    : currentStore.profile.openDate;
                const firstDeliveryDate =
                  pendingDateChange.field === "firstDeliveryDate"
                    ? pendingDateChange.newDate
                    : currentStore.profile.firstDeliveryDate;
                applyDueDates(selectedStoreId, openDate, firstDeliveryDate);
                setPendingDateChange(null);
              }}
            >
              はい
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarProvider
        defaultOpen
        className="h-screen w-full overflow-hidden bg-background text-foreground"
        style={
          {
            "--background": bgPreset.background,
            "--sidebar": bgPreset.sidebar,
            "--canvas": bgPreset.canvas,
            "--border": bgPreset.border,
            "--input": bgPreset.border,
            "--muted": bgPreset.muted,
            "--secondary": bgPreset.secondary,
            "--sidebar-border": bgPreset.sidebarBorder,
          } as React.CSSProperties
        }
      >
        <StoreListPane
          workspaceName={workspace.name}
          groups={storeGroups}
          selectedStoreId={selectedStoreId}
          onSelectStore={selectStore}
          onMoveStore={moveStore}
          onAddStore={addStore}
        />
        <SidebarInset className="flex min-w-0 flex-col bg-background">
          <GlobalHeader
            storeName={activeStore.profile.name}
            urgencySettings={urgencySettings}
            onSaveUrgencySettings={handleSaveUrgencySettings}
            bgColorId={bgColorId}
            onSaveBgColor={handleSaveBgColor}
            taskDueDateOffsets={taskDueDateOffsets}
            onSaveTaskDueDateOffsets={handleSaveTaskDueDateOffsets}
          />
          <div className="flex min-h-0 flex-1">
            <StoreProfilePane
              key={activeStore.id}
              profile={activeStore.profile}
              onUpdateProfile={updateProfilePartial}
              onUpdateOpenDate={handleUpdateOpenDate}
              onUpdateFirstDeliveryDate={handleUpdateFirstDeliveryDate}
              onDeleteStore={() => deleteStore(activeStore.id)}
            />
            <TaskListPane
              tasks={taskRows}
              selectedTaskId={selectedTaskId}
              onSelectTask={selectTask}
              onAddTask={addTask}
            />
            <TaskDetailPane
              task={selectedTask}
              profile={activeStore.profile}
              pane4Open={pane4Open}
              onTogglePane4={togglePane4}
              onUpdateTask={updateTask}
              onUpdateProfile={updateProfilePartial}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}

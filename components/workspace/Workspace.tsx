"use client";

/**
 * Workspace: 新店舗オープン進捗管理の 4 ペイン親コンポーネント。
 *
 * Pane 1: 店舗一覧（ステータス別グループ・ドラッグ移動）
 * Pane 2: 店舗プロフィール
 * Pane 3: タスク一覧（信号機 + ステータス）
 * Pane 4: タスク詳細 / 号車報告書フォーム
 */

import { useState, useCallback, useMemo, useEffect } from "react";

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
  type UrgencySettings,
} from "@/lib/urgencySettings";
import {
  BG_COLOR_PRESETS,
  loadBgColorId,
  saveBgColorId,
} from "@/lib/backgroundColorSettings";
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
  const [urgencySettings, setUrgencySettings] = useState<UrgencySettings>(
    loadUrgencySettings,
  );
  const [bgColorId, setBgColorId] = useState<string>(loadBgColorId);

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
    saveUrgencySettings(s);
    setUrgencySettings(s);
  }, []);

  const handleSaveBgColor = useCallback((id: string) => {
    saveBgColorId(id);
    setBgColorId(id);
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
      const tasks = generateDefaultTasks(id);
      const newStore: Store = { id, status: "notStarted", profile, tasks };
      setStores((prev) => [...prev, newStore]);
      selectStore(id);
      void onAddStore?.(id, profile);
    },
    [selectStore, onAddStore],
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

  // プロフィール変更を state と DB に反映
  const updateProfilePartial = useCallback(
    (updates: Partial<StoreProfile>) => {
      const currentProfile = stores.find((s) => s.id === selectedStoreId)?.profile;
      if (!currentProfile) return;
      const newProfile = { ...currentProfile, ...updates };
      setProfile(newProfile);
      void onSaveProfile?.(selectedStoreId, newProfile);
    },
    [selectedStoreId, stores, setProfile, onSaveProfile],
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

  return (
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
          />
        <div className="flex min-h-0 flex-1">
          <StoreProfilePane
            key={activeStore.id}
            profile={activeStore.profile}
            onUpdateProfile={updateProfilePartial}
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
  );
}

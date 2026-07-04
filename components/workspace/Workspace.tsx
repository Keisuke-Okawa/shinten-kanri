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
import { STORE_STATUS_LABELS } from "@/lib/labels";
import {
  deriveTrafficLight,
  getDisplayTaskStatus,
  getStoreProgressPercent,
  getStoreTrafficLight,
  getVisibleSubtasks,
  shouldAutoComplete,
  sortTasksForDisplay,
} from "@/lib/computed/tasks";
import {
  loadUrgencySettings,
  saveUrgencySettings,
  type UrgencySettings,
} from "@/lib/urgencySettings";
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
};

export function Workspace({
  initialStores,
  workspace,
  onSaveStoreStatus,
  onSaveTaskStatus,
  onToggleSubtask,
}: WorkspaceProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("s1");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1-1");
  const [pane4ManuallyClosed, setPane4ManuallyClosed] = useState(false);
  const [urgencySettings, setUrgencySettings] = useState<UrgencySettings>(
    loadUrgencySettings,
  );

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
    [selectedStoreId, selectedTaskId, onSaveTaskStatus, onToggleSubtask],
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

  const updateProfilePartial = useCallback(
    (updates: Partial<StoreProfile>) => {
      setProfile((prev) => ({ ...prev, ...updates }));
    },
    [setProfile],
  );

  const togglePane4 = useCallback(
    () => setPane4ManuallyClosed((v) => !v),
    [],
  );

  // 手動ドラッグによるグループ移動。完了の強制ルールが成立している店舗は移動不可。
  const moveStore = useCallback(
    (id: string, toStatus: StoreStatusKey) => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (shouldAutoComplete(s)) return s;
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
        .filter((s) => {
          const effectiveStatus = shouldAutoComplete(s)
            ? "completed"
            : s.status;
          return effectiveStatus === status;
        })
        .sort((a, b) =>
          a.profile.openDate.localeCompare(b.profile.openDate),
        )
        .map((s) => ({
          id: s.id,
          name: s.profile.name,
          openDate: s.profile.openDate,
          progressPercent: getStoreProgressPercent(s),
          storeTrafficLight: getStoreTrafficLight(s, urgencySettings, today),
          autoCompleted: shouldAutoComplete(s),
        })),
    }));
  }, [stores, urgencySettings, today]);

  const taskRows = useMemo(
    () =>
      sortTasksForDisplay(
        activeStore.tasks.map((task) => {
          const displayStatus = getDisplayTaskStatus(task, activeStore.profile);
          return {
            ...task,
            subtasks: getVisibleSubtasks(task.subtasks, activeStore.profile),
            displayStatus,
            trafficLight: deriveTrafficLight(task.dueDate, displayStatus, urgencySettings, today),
          };
        }),
      ),
    [activeStore, urgencySettings, today],
  );

  const selectedTask = useMemo(() => {
    const task = activeStore.tasks.find((t) => t.id === selectedTaskId) ?? null;
    if (!task) return null;
    return {
      ...task,
      subtasks: getVisibleSubtasks(task.subtasks, activeStore.profile),
    };
  }, [activeStore, selectedTaskId]);

  return (
    <SidebarProvider
      defaultOpen
      className="h-screen w-full overflow-hidden bg-background text-foreground"
    >
      <StoreListPane
        workspaceName={workspace.name}
        groups={storeGroups}
        selectedStoreId={selectedStoreId}
        onSelectStore={selectStore}
        onMoveStore={moveStore}
      />
      <SidebarInset className="flex min-w-0 flex-col bg-background">
        <GlobalHeader
            storeName={activeStore.profile.name}
            urgencySettings={urgencySettings}
            onSaveUrgencySettings={handleSaveUrgencySettings}
          />
        <div className="flex min-h-0 flex-1">
          <StoreProfilePane
            profile={activeStore.profile}
            setProfile={setProfile}
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

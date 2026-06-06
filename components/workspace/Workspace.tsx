"use client";

/**
 * Workspace: 新店舗オープン進捗管理の 4 ペイン親コンポーネント。
 *
 * Pane 1: 店舗一覧（ステータス別グループ・ドラッグ移動）
 * Pane 2: 店舗プロフィール
 * Pane 3: タスク一覧（信号機 + ステータス）
 * Pane 4: タスク詳細 / 号車報告書フォーム
 */

import { useState, useCallback, useMemo } from "react";

import {
  type Store,
  type StoreProfile,
  type StoreStatusKey,
  type Task,
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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { GlobalHeader } from "@/components/workspace/GlobalHeader";
import { StoreListPane } from "@/components/workspace/StoreListPane";
import { StoreProfilePane } from "@/components/workspace/StoreProfilePane";
import { TaskListPane } from "@/components/workspace/TaskListPane";
import { TaskDetailPane } from "@/components/workspace/TaskDetailPane";

type WorkspaceProps = {
  initialStores: Store[];
  workspace: { name: string; icon: string };
};

export function Workspace({ initialStores, workspace }: WorkspaceProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("s1");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1-1");
  const [pane4ManuallyClosed, setPane4ManuallyClosed] = useState(false);

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
    [selectedStoreId, selectedTaskId],
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
  const moveStore = useCallback((id: string, toStatus: StoreStatusKey) => {
    setStores((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (shouldAutoComplete(s)) return s;
        return { ...s, status: toStatus };
      }),
    );
  }, []);

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
          storeTrafficLight: getStoreTrafficLight(s),
          autoCompleted: shouldAutoComplete(s),
        })),
    }));
  }, [stores]);

  const taskRows = useMemo(
    () =>
      sortTasksForDisplay(
        activeStore.tasks.map((task) => {
          const displayStatus = getDisplayTaskStatus(task, activeStore.profile);
          return {
            ...task,
            subtasks: getVisibleSubtasks(task.subtasks, activeStore.profile),
            displayStatus,
            trafficLight: deriveTrafficLight(task.dueDate, displayStatus),
          };
        }),
      ),
    [activeStore],
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
        <GlobalHeader storeName={activeStore.profile.name} />
        <div className="flex min-h-0 flex-1">
          <StoreProfilePane
            profile={activeStore.profile}
            setProfile={setProfile}
          />
          <TaskListPane
            tasks={taskRows}
            selectedTaskId={selectedTaskId}
            onSelectTask={selectTask}
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

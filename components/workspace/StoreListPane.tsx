"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import { type StoreGroup, type StoreRow, type StoreStatusKey } from "@/lib/schema";
import { STORE_STATUS_LABELS } from "@/lib/labels";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pane1Toggle } from "@/components/workspace/Pane1Toggle";
import { SortableStoreRow } from "@/components/workspace/SortableStoreRow";

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Space または Enter で店舗を持ち上げ、矢印キーで移動、Space で確定、Esc でキャンセルします。",
};

type StoreListPaneProps = {
  workspaceName: string;
  groups: StoreGroup[];
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
  onMoveStore: (id: string, toStatus: StoreStatusKey) => void;
};

export function StoreListPane({
  workspaceName,
  groups,
  selectedStoreId,
  onSelectStore,
  onMoveStore,
}: StoreListPaneProps) {
  // 各グループの折りたたみ状態（デフォルト: 全て開く）
  const [groupOpen, setGroupOpen] = useState<Record<StoreStatusKey, boolean>>({
    inProgress: true,
    notStarted: true,
    completed: true,
  });

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeDragRow: StoreRow | null = (() => {
    if (!activeDragId) return null;
    for (const g of groups) {
      const row = g.items.find((r) => r.id === activeDragId);
      if (row) return row;
    }
    return null;
  })();

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const name = (active.data.current?.name as string | undefined) ?? "店舗";
      return `${name}を持ち上げました。`;
    },
    onDragOver: ({ active, over }) => {
      const name = (active.data.current?.name as string | undefined) ?? "店舗";
      if (!over) return `${name}を移動中です。`;
      const containerId = over.data.current?.containerId as
        | StoreStatusKey
        | undefined;
      if (containerId)
        return `${name}を「${STORE_STATUS_LABELS[containerId]}」の上に移動しました。`;
      return `${name}を移動中です。`;
    },
    onDragEnd: ({ active, over }) => {
      const name = (active.data.current?.name as string | undefined) ?? "店舗";
      if (!over) return `${name}の移動をキャンセルしました。`;
      const containerId =
        (over.data.current?.containerId as StoreStatusKey | undefined) ??
        (typeof over.id === "string" &&
        groups.some((g) => g.status === over.id)
          ? (over.id as StoreStatusKey)
          : undefined);
      if (!containerId) return `${name}を確定しました。`;
      return `${name}を「${STORE_STATUS_LABELS[containerId]}」に移動しました。`;
    },
    onDragCancel: ({ active }) => {
      const name = (active.data.current?.name as string | undefined) ?? "店舗";
      return `${name}の移動をキャンセルしました。`;
    },
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const toStatus =
      (over.data.current?.containerId as StoreStatusKey | undefined) ??
      (typeof over.id === "string" &&
      groups.some((g) => g.status === over.id)
        ? (over.id as StoreStatusKey)
        : undefined);

    if (!toStatus) return;
    onMoveStore(String(active.id), toStatus);
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border [&_[data-slot=sidebar-container]]:bg-sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex h-12 items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[state=expanded]:px-5">
          <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {workspaceName}
          </h2>
          <Pane1Toggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        <ScrollArea className="h-full">
          <DndContext
            id="pane1-store-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            accessibility={{ announcements, screenReaderInstructions }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragId(null)}
          >
            <div className="flex flex-col gap-1 px-2 py-3">
              {groups.map((group) => (
                <StatusGroup
                  key={group.status}
                  group={group}
                  open={groupOpen[group.status]}
                  onOpenChange={(open) =>
                    setGroupOpen((prev) => ({ ...prev, [group.status]: open }))
                  }
                  selectedStoreId={selectedStoreId}
                  onSelectStore={onSelectStore}
                />
              ))}
            </div>

            <DragOverlay>
              {activeDragRow && (
                <div className="flex flex-col rounded-md bg-sidebar-accent px-2 py-2 shadow-lg">
                  <span className="text-sm font-medium text-sidebar-accent-foreground">
                    {activeDragRow.name}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <Button variant="outline" size="sm" className="w-full">
          <Plus aria-hidden />
          店舗を追加
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

// ===== グループコンポーネント =====

function StatusGroup({
  group,
  open,
  onOpenChange,
  selectedStoreId,
  onSelectStore,
}: {
  group: StoreGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStoreId: string;
  onSelectStore: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dropzone:${group.status}`,
    data: { containerId: group.status },
  });

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      {/* グループヘッダー */}
      <CollapsibleTrigger
        nativeButton={false}
        render={
          <div
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5",
              "text-sidebar-foreground/70 transition-colors",
              "hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
            )}
          />
        }
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide">
          {STORE_STATUS_LABELS[group.status]}
        </span>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
          {group.items.length}
        </Badge>
      </CollapsibleTrigger>

      {/* グループ内容 */}
      <CollapsibleContent>
        <SortableContext
          id={group.status}
          items={group.items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul
            ref={setNodeRef}
            data-status={group.status}
            className={cn(
              "mt-1 flex flex-col gap-0.5",
              group.items.length === 0 &&
                "min-h-10 rounded-md border border-dashed border-border/60 px-2 py-1",
              group.items.length === 0 && isOver && "border-primary/60 bg-primary/5",
            )}
          >
            {group.items.length === 0 ? (
              <li
                className={cn(
                  "pointer-events-none flex h-8 items-center justify-center text-[11px]",
                  isOver ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              >
                ここへドラッグ
              </li>
            ) : (
              group.items.map((store) => (
                <SortableStoreRow
                  key={store.id}
                  store={store}
                  status={group.status}
                  selected={store.id === selectedStoreId}
                  onSelect={onSelectStore}
                />
              ))
            )}
          </ul>
        </SortableContext>
      </CollapsibleContent>
    </Collapsible>
  );
}

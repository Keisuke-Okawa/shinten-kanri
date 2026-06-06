"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { type Task, type TaskStatusKey } from "@/lib/schema";
import {
  TASK_STATUS_LABELS,
  TRAFFIC_LIGHT_LABELS,
} from "@/lib/labels";
import { type TrafficLight } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrafficLightDot } from "@/components/workspace/StoreProfilePane";
import { InlineDateField, InlineFieldRow, InlineSelectField } from "@/components/primitives";

type TaskRow = Task & {
  displayStatus: TaskStatusKey;
  trafficLight: TrafficLight | null;
};

type TaskListPaneProps = {
  tasks: TaskRow[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: (task: Omit<Task, "id">) => void;
};

function statusBadgeVariant(
  status: TaskStatusKey,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "completed":
      return "secondary";
    case "inProgress":
      return "default";
    case "na":
      return "outline";
    default:
      return "outline";
  }
}

function formatDueDate(date: string): string {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  return `${parts[1]}/${parts[2]}`;
}

const STATUS_OPTIONS = ["未着手", "進行中"] as const;

function labelToStatus(label: string): TaskStatusKey {
  if (label === "進行中") return "inProgress";
  return "notStarted";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function AddTaskDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (task: Omit<Task, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(todayIso());
  const [statusLabel, setStatusLabel] = useState<string>("未着手");

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed || !dueDate) return;
    onAdd({
      name: trimmed,
      kind: "standard",
      status: labelToStatus(statusLabel),
      dueDate,
    });
    setName("");
    setDueDate(todayIso());
    setStatusLabel("未着手");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>タスクを追加</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm">
          <InlineFieldRow label="タスク名">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="タスク名を入力"
              className="h-7 text-sm"
              autoFocus
            />
          </InlineFieldRow>
          <InlineFieldRow label="期日">
            <InlineDateField
              value={dueDate}
              onSave={setDueDate}
              ariaLabel="期日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="ステータス">
            <InlineSelectField
              value={statusLabel}
              options={STATUS_OPTIONS}
              onSave={setStatusLabel}
              ariaLabel="ステータス"
            />
          </InlineFieldRow>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim() || !dueDate}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TaskListPane({
  tasks,
  selectedTaskId,
  onSelectTask,
  onAddTask,
}: TaskListPaneProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-canvas">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-6">
          {tasks.filter((task) => task.displayStatus !== "na").map((task) => {
            const active = task.id === selectedTaskId;
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelectTask(task.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors",
                  active && "border-primary/40 bg-primary/5",
                  !active && "hover:bg-muted/50",
                )}
              >
                {task.trafficLight ? (
                  <TrafficLightDot light={task.trafficLight} />
                ) : (
                  <span className="size-2.5 shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {task.name}
                    </span>
                    {task.kind === "vehicleReport" && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        報告書
                      </Badge>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {task.subtasks.filter((s) => s.completed).length}/
                        {task.subtasks.length}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    期日 {formatDueDate(task.dueDate)}
                    {task.trafficLight && (
                      <> · {TRAFFIC_LIGHT_LABELS[task.trafficLight]}</>
                    )}
                  </span>
                </div>

                <Badge
                  variant={statusBadgeVariant(task.displayStatus)}
                  className="shrink-0"
                >
                  {TASK_STATUS_LABELS[task.displayStatus]}
                </Badge>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border bg-canvas px-6 py-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setDialogOpen(true)}
        >
          <Plus aria-hidden />
          タスクを追加
        </Button>
      </div>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={onAddTask}
      />
    </section>
  );
}

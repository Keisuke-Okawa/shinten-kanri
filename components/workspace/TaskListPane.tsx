"use client";

import { cn } from "@/lib/utils";
import { type Task, type TaskStatusKey } from "@/lib/schema";
import {
  TASK_STATUS_LABELS,
  TRAFFIC_LIGHT_LABELS,
  PANE3_SECTION,
} from "@/lib/labels";
import { type TrafficLight } from "@/lib/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrafficLightDot } from "@/components/workspace/StoreProfilePane";

type TaskRow = Task & {
  displayStatus: TaskStatusKey;
  trafficLight: TrafficLight | null;
};

type TaskListPaneProps = {
  tasks: TaskRow[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
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
  return date.replace(/-/g, "/");
}

export function TaskListPane({
  tasks,
  selectedTaskId,
  onSelectTask,
}: TaskListPaneProps) {
  return (
    <section className="min-w-0 flex-1 bg-canvas">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-6">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">
            {PANE3_SECTION.taskList}
          </h2>
          <p className="text-xs text-muted-foreground">
            {PANE3_SECTION.taskListDescription}
          </p>
        </div>
      </header>

      <ScrollArea className="h-[calc(100%-3rem)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-6">
          {tasks.map((task) => {
            const active = task.id === selectedTaskId;
            const isNa = task.displayStatus === "na";
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => !isNa && onSelectTask(task.id)}
                disabled={isNa}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors",
                  active && "border-primary/40 bg-primary/5",
                  isNa && "cursor-not-allowed opacity-50",
                  !isNa && !active && "hover:bg-muted/50",
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
                  </div>
                  {!isNa && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      期日 {formatDueDate(task.dueDate)}
                      {task.trafficLight && (
                        <> · {TRAFFIC_LIGHT_LABELS[task.trafficLight]}</>
                      )}
                    </span>
                  )}
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
    </section>
  );
}

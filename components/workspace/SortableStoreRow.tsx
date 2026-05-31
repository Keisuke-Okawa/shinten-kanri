"use client";

import { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  type StoreRow,
  type StoreStatusKey,
  type TrafficLight,
} from "@/lib/schema";

const TRAFFIC_DOT_CLASS: Record<TrafficLight, string> = {
  green: "bg-traffic-green",
  yellow: "bg-traffic-yellow",
  red: "bg-traffic-red",
};

function formatOpenDate(date: string): string {
  const m = date.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return date;
  return `${Number(m[1])}/${Number(m[2])}`;
}

export function SortableStoreRow({
  store,
  status,
  selected,
  onSelect,
}: {
  store: StoreRow;
  status: StoreStatusKey;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: store.id,
    data: { containerId: status, name: store.name },
    disabled: store.autoCompleted,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/store relative",
        isDragging && "pointer-events-none opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(store.id)}
        className={cn(
          "flex w-full flex-col rounded-md px-2 py-2 text-left transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
          selected
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent/60 text-sidebar-foreground",
        )}
      >
        {/* 行 1: グリップ + 信号機ドット + 店舗名 */}
        <div className="flex items-center gap-1.5">
          <span
            {...attributes}
            {...listeners}
            aria-label={`${store.name} の並び替え`}
            className={cn(
              "flex size-4 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground",
              "opacity-0 transition-opacity",
              !store.autoCompleted &&
                "group-hover/store:opacity-100 group-focus-within/store:opacity-100",
              "hover:text-foreground active:cursor-grabbing",
              "outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-sidebar-ring/50",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical aria-hidden className="size-3.5" />
          </span>
          <span
            className={cn(
              "size-3 shrink-0 rounded-full",
              TRAFFIC_DOT_CLASS[store.storeTrafficLight],
            )}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {store.name}
          </span>
        </div>

        {/* 行 2: オープン日 + 進捗バー（グリップ幅分インデント） */}
        <div className="mt-1 flex items-center gap-2 pl-[22px]">
          <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
            {formatOpenDate(store.openDate)}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${store.progressPercent}%` }}
            />
          </div>
        </div>
      </button>
    </li>
  );
}

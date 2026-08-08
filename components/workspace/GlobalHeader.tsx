"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

import {
  DEFAULT_URGENCY_SETTINGS,
  type UrgencySettings,
} from "@/lib/urgencySettings";
import {
  BG_COLOR_PRESETS,
  type BgColorPreset,
} from "@/lib/backgroundColorSettings";
import {
  DEFAULT_TASK_DUE_DATE_OFFSETS,
  type DueDateReference,
  type TaskDueDateOffsets,
} from "@/lib/taskDueDateOffsets";
import { TASK_TEMPLATE_NAMES } from "@/lib/defaultTasks";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SectionLabel } from "@/components/primitives/SectionLabel";

// ── 設定サブビュー: タスク期日オフセット編集 ──────────────────────────

type TaskOffsetEntry = {
  name: string;
  reference: DueDateReference;
  days: string; // input は string で管理し保存時に number 変換
  isNull: boolean;
};

function sortEntries(entries: TaskOffsetEntry[]): TaskOffsetEntry[] {
  return [...entries].sort((a, b) => {
    // グループ: openDate 先
    if (a.reference !== b.reference) {
      return a.reference === "openDate" ? -1 : 1;
    }
    // null は末尾
    if (a.isNull !== b.isNull) return a.isNull ? 1 : -1;
    // days 降順（大きい = 早い = 上）
    const da = parseFloat(a.days) || 0;
    const db = parseFloat(b.days) || 0;
    return db - da;
  });
}

function buildInitialEntries(offsets: TaskDueDateOffsets): TaskOffsetEntry[] {
  return sortEntries(
    TASK_TEMPLATE_NAMES.map((name) => {
      const cfg = offsets[name];
      if (!cfg) {
        return {
          name,
          reference: "openDate",
          days: "",
          isNull: true,
        };
      }
      return {
        name,
        reference: cfg.reference,
        days: String(cfg.days),
        isNull: false,
      };
    }),
  );
}

function TaskDueDatesForm({
  initialOffsets,
  onSave,
  onBack,
}: {
  initialOffsets: TaskDueDateOffsets;
  onSave: (s: TaskDueDateOffsets) => void;
  onBack: () => void;
}) {
  const [entries, setEntries] = useState<TaskOffsetEntry[]>(() =>
    buildInitialEntries(initialOffsets),
  );

  function updateEntry(name: string, patch: Partial<TaskOffsetEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.name === name ? { ...e, ...patch } : e)),
    );
  }

  function handleBlurSort() {
    setEntries((prev) => sortEntries(prev));
  }

  function handleSave() {
    const result: TaskDueDateOffsets = {};
    for (const e of entries) {
      if (e.isNull || e.days === "") {
        result[e.name] = null;
        continue;
      }
      const days = parseInt(e.days, 10);
      if (isNaN(days)) {
        result[e.name] = null;
        continue;
      }
      result[e.name] = { reference: e.reference, days };
    }
    onSave(result);
    onBack();
  }

  // グループラベル挿入のための配列加工
  const grouped: Array<{ type: "label"; label: string } | { type: "row"; entry: TaskOffsetEntry }> = [];
  let lastRef: DueDateReference | null = null;
  for (const entry of entries) {
    const ref = entry.isNull ? null : entry.reference;
    if (ref !== lastRef && ref !== null) {
      grouped.push({
        type: "label",
        label: ref === "openDate" ? "オープン日基準" : "初回納品日基準",
      });
      lastRef = ref;
    } else if (ref === null && lastRef !== null) {
      grouped.push({ type: "label", label: "自動設定なし" });
      lastRef = null;
    }
    grouped.push({ type: "row", entry });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 戻るボタン */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        設定に戻る
      </button>

      <div className="flex flex-col gap-1">
        {grouped.map((item, i) => {
          if (item.type === "label") {
            return (
              <p key={`label-${i}`} className="mt-2 text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
            );
          }
          const e = item.entry;
          return (
            <div key={e.name} className="flex items-center gap-2 rounded-md py-1 text-sm">
              <span className="w-36 shrink-0 text-foreground">{e.name}</span>
              {/* 基準日セレクト */}
              <select
                value={e.reference}
                onChange={(ev) =>
                  updateEntry(e.name, {
                    reference: ev.target.value as DueDateReference,
                  })
                }
                onBlur={handleBlurSort}
                className="rounded-md border border-input bg-card px-1 py-0.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                <option value="openDate">オープン日</option>
                <option value="firstDeliveryDate">初回納品日</option>
              </select>
              {/* 日数インプット */}
              <input
                type="number"
                value={e.days}
                placeholder="—"
                onChange={(ev) =>
                  updateEntry(e.name, {
                    days: ev.target.value,
                    isNull: ev.target.value === "",
                  })
                }
                onBlur={handleBlurSort}
                className="w-14 rounded-md border border-input bg-card px-2 py-0.5 text-right text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/50"
                aria-label={`${e.name} の日数`}
              />
              <span className="shrink-0 text-xs text-muted-foreground">日前</span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        負の値（例: -7）は基準日の 7 日後を意味します。空欄は自動設定しません。
      </p>

      <DialogFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEntries(buildInitialEntries(DEFAULT_TASK_DUE_DATE_OFFSETS));
          }}
        >
          デフォルトに戻す
        </Button>
        <Button size="sm" onClick={handleSave}>
          保存
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── 設定フォーム（メインビュー） ──────────────────────────────────────

type SettingsView = "main" | "taskDueDates";

function SettingsForm({
  initialUrgency,
  bgColorId,
  taskDueDateOffsets,
  onSave,
  onClose,
  onBgColorChange,
  onSaveTaskDueDateOffsets,
}: {
  initialUrgency: UrgencySettings;
  bgColorId: string;
  taskDueDateOffsets: TaskDueDateOffsets;
  onSave: (s: UrgencySettings) => void;
  onClose: () => void;
  onBgColorChange: (id: string) => void;
  onSaveTaskDueDateOffsets: (s: TaskDueDateOffsets) => void;
}) {
  const [view, setView] = useState<SettingsView>("main");
  const [redDays, setRedDays] = useState(String(initialUrgency.redDays));
  const [yellowDays, setYellowDays] = useState(String(initialUrgency.yellowDays));

  const redNum = Math.max(1, parseInt(redDays, 10) || 1);
  const yellowNum = Math.max(redNum + 1, parseInt(yellowDays, 10) || redNum + 1);
  const isValid =
    !isNaN(parseInt(redDays, 10)) &&
    !isNaN(parseInt(yellowDays, 10)) &&
    yellowNum > redNum;

  function handleSave() {
    if (!isValid) return;
    onSave({ redDays: redNum, yellowDays: yellowNum });
    onClose();
  }

  function handleReset() {
    setRedDays(String(DEFAULT_URGENCY_SETTINGS.redDays));
    setYellowDays(String(DEFAULT_URGENCY_SETTINGS.yellowDays));
  }

  if (view === "taskDueDates") {
    return (
      <TaskDueDatesForm
        initialOffsets={taskDueDateOffsets}
        onSave={onSaveTaskDueDateOffsets}
        onBack={() => setView("main")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 緊急度の設定 */}
      <div className="flex flex-col gap-3">
        <SectionLabel>緊急度の設定</SectionLabel>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 shrink-0 rounded-full bg-traffic-red" />
            <span className="w-32 shrink-0 text-foreground">緊急（赤）</span>
            <span className="text-muted-foreground">期日まで</span>
            <input
              type="number"
              min={1}
              max={30}
              value={redDays}
              onChange={(e) => setRedDays(e.target.value)}
              className="w-16 rounded-md border border-input bg-card px-2 py-1 text-right text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/50"
              aria-label="緊急（赤）の日数"
            />
            <span className="text-muted-foreground">日以内</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 shrink-0 rounded-full bg-traffic-yellow" />
            <span className="w-32 shrink-0 text-foreground">期日迫る（黄）</span>
            <span className="text-muted-foreground">期日まで</span>
            <input
              type="number"
              min={2}
              max={60}
              value={yellowDays}
              onChange={(e) => setYellowDays(e.target.value)}
              className="w-16 rounded-md border border-input bg-card px-2 py-1 text-right text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/50"
              aria-label="期日迫る（黄）の日数"
            />
            <span className="text-muted-foreground">日以内</span>
          </div>
          <p className="text-xs text-muted-foreground">
            緊急の日数より大きい値を設定してください。
            それ以上は順調（緑）になります。
          </p>
        </div>
      </div>

      <Separator />

      {/* タスク期日の変更 */}
      <div className="flex flex-col gap-3">
        <SectionLabel>タスク期日の変更</SectionLabel>
        <button
          type="button"
          onClick={() => setView("taskDueDates")}
          className="flex items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span>各タスクのデフォルト期日を設定</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>

      <Separator />

      {/* 背景カラー */}
      <div className="flex flex-col gap-3">
        <SectionLabel>背景カラー</SectionLabel>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {BG_COLOR_PRESETS.map((preset: BgColorPreset) => (
              <button
                key={preset.id}
                type="button"
                aria-label={preset.label}
                aria-pressed={bgColorId === preset.id}
                onClick={() => onBgColorChange(preset.id)}
                className="size-7 rounded-full transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                style={{
                  backgroundColor: preset.border,
                  boxShadow:
                    bgColorId === preset.id
                      ? `0 0 0 2px white, 0 0 0 4px ${preset.sidebarBorder}`
                      : `inset 0 0 0 1px ${preset.sidebarBorder}`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          デフォルトに戻す
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!isValid}>
          保存
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── GlobalHeader ────────────────────────────────────────────────────

type GlobalHeaderProps = {
  storeName: string;
  urgencySettings: UrgencySettings;
  onSaveUrgencySettings: (s: UrgencySettings) => void;
  bgColorId: string;
  onSaveBgColor: (id: string) => void;
  taskDueDateOffsets: TaskDueDateOffsets;
  onSaveTaskDueDateOffsets: (s: TaskDueDateOffsets) => void;
};

export function GlobalHeader({
  storeName,
  urgencySettings,
  onSaveUrgencySettings,
  bgColorId,
  onSaveBgColor,
  taskDueDateOffsets,
  onSaveTaskDueDateOffsets,
}: GlobalHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <Breadcrumb
        className="min-w-0 flex-1 overflow-hidden"
        aria-label="パンくず"
      >
        <BreadcrumbList className="flex-nowrap text-[11px]">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink>新店舗オープン管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-medium">
              {storeName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Dialog open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger
            render={
              <DialogTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="設定"
                  />
                }
              >
                <Settings />
              </DialogTrigger>
            }
          />
          <TooltipContent side="bottom">設定</TooltipContent>
        </Tooltip>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>設定</DialogTitle>
          </DialogHeader>
          <SettingsForm
            initialUrgency={urgencySettings}
            bgColorId={bgColorId}
            taskDueDateOffsets={taskDueDateOffsets}
            onSave={onSaveUrgencySettings}
            onClose={() => setOpen(false)}
            onBgColorChange={onSaveBgColor}
            onSaveTaskDueDateOffsets={onSaveTaskDueDateOffsets}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}

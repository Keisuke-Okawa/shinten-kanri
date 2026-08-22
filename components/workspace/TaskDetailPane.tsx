"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type StoreProfile,
  type SubTask,
  type Task,
  type TaskStatusKey,
} from "@/lib/schema";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { Pane4Toggle } from "@/components/workspace/Pane4Toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Check, Pencil, X } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import {
  InlineTextField,
  InlineDateField,
  InlineTextareaField,
  InlineFieldRow,
  InlineNumberField,
} from "@/components/primitives";
import { Pane4Section } from "@/components/workspace/Pane4Section";

const TASK_STATUS_KEYS = ["notStarted", "inProgress", "completed"] as const;
type EditableTaskStatusKey = (typeof TASK_STATUS_KEYS)[number];

/** 号車報告書のラベル幅。入力欄・トグルの左端を縦一列に揃える */
/** 最長ラベル「サーバー設置日」基準（7文字 × 0.875rem = 6.125rem） */
const VR_FIELD_LABEL_WIDTH = "w-[6.125rem]";

function OptionToggleGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabelPrefix,
}: {
  value: T | "";
  options: readonly T[];
  onChange: (v: T | "") => void;
  ariaLabelPrefix?: string;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <Toggle
          key={opt}
          pressed={value === opt}
          onPressedChange={(pressed) => onChange(pressed ? opt : "")}
          variant="bordered"
          size="sm"
          aria-label={ariaLabelPrefix ? `${ariaLabelPrefix} ${opt}` : opt}
          className="px-3"
        >
          {opt}
        </Toggle>
      ))}
    </div>
  );
}

function YesNoToggleGroup({
  value,
  onChange,
  ariaLabelPrefix,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  ariaLabelPrefix: string;
}) {
  return (
    <div className="flex gap-1.5">
      {(["あり", "なし"] as const).map((opt) => {
        const isYes = opt === "あり";
        return (
          <Toggle
            key={opt}
            pressed={value === isYes}
            onPressedChange={(pressed) => {
              if (pressed) onChange(isYes);
            }}
            variant="bordered"
            size="sm"
            aria-label={`${ariaLabelPrefix} ${opt}`}
            className="px-3"
          >
            {opt}
          </Toggle>
        );
      })}
    </div>
  );
}

function StatusToggleGroup({
  value,
  onChange,
}: {
  value: TaskStatusKey;
  onChange: (v: EditableTaskStatusKey) => void;
}) {
  return (
    <div className="flex gap-2">
      {TASK_STATUS_KEYS.map((status) => (
        <Toggle
          key={status}
          pressed={value === status}
          onPressedChange={(pressed) => {
            if (pressed) onChange(status);
          }}
          variant="bordered"
          size="sm"
          aria-label={TASK_STATUS_LABELS[status]}
          className="px-3"
        >
          {TASK_STATUS_LABELS[status]}
        </Toggle>
      ))}
    </div>
  );
}

type TaskDetailPaneProps = {
  task: Task | null;
  profile: StoreProfile;
  pane4Open: boolean;
  onTogglePane4: () => void;
  onUpdateTask: (updates: Partial<Task>) => void;
  onUpdateProfile: (updates: Partial<StoreProfile>) => void;
  onUpdateOpenDate: (v: string) => void;
  onUpdateFirstDeliveryDate: (v: string) => void;
};

function EditableTaskName({
  name,
  onSave,
}: {
  name: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div
        className="min-w-0 flex-1"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            setEditing(false);
          }
        }}
      >
        <InlineTextField
          value={name}
          onSave={(v) => {
            const trimmed = v.trim();
            if (trimmed) onSave(trimmed);
            setEditing(false);
          }}
          ariaLabel="タスク名"
          autoFocus
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="truncate text-sm font-semibold text-foreground">
        {name}
      </span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="タスク名を編集"
        className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

function StandardTaskDetail({
  task,
  onUpdateTask,
}: {
  task: Task;
  onUpdateTask: (updates: Partial<Task>) => void;
}) {
  const [newSubtaskName, setNewSubtaskName] = useState("");

  const subtasks: SubTask[] = task.subtasks ?? [];

  function toggleSubtask(id: string) {
    const updated = subtasks.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s,
    );
    onUpdateTask({ subtasks: updated });
  }

  function deleteSubtask(id: string) {
    onUpdateTask({ subtasks: subtasks.filter((s) => s.id !== id) });
  }

  function addSubtask() {
    const name = newSubtaskName.trim();
    if (!name) return;
    const newSubtask: SubTask = {
      id: `${task.id}-${Date.now()}`,
      name,
      completed: false,
    };
    const pinned = subtasks.filter((s) => s.pinBottom);
    const rest = subtasks.filter((s) => !s.pinBottom);
    onUpdateTask({ subtasks: [...rest, newSubtask, ...pinned] });
    setNewSubtaskName("");
  }

  return (
    <div className="flex flex-col gap-1">
      <Pane4Section id="task-meta" title="タスク情報">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="期日">
            <InlineDateField
              value={task.dueDate}
              onSave={(v) => onUpdateTask({ dueDate: v })}
              ariaLabel="期日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="ステータス">
            <StatusToggleGroup
              value={task.status}
              onChange={(v) => onUpdateTask({ status: v })}
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

      <Pane4Section id="task-subtasks" title="子タスク">
        <div className="flex flex-col gap-1.5">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                aria-label={subtask.completed ? "完了を取り消す" : "完了にする"}
                onClick={() => toggleSubtask(subtask.id)}
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border border-border",
                  subtask.completed && "border-primary bg-primary",
                )}
              >
                {subtask.completed && (
                  <Check className="size-3 text-primary-foreground" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  subtask.completed && "text-muted-foreground line-through",
                )}
              >
                {subtask.name}
              </span>
              <button
                type="button"
                aria-label="削除"
                onClick={() => deleteSubtask(subtask.id)}
                className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newSubtaskName}
              onChange={(e) => setNewSubtaskName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubtask()}
              placeholder="子タスクを入力"
              className="h-7 w-36 text-sm"
            />
            <Button size="sm" variant="outline" onClick={addSubtask}>
              追加
            </Button>
          </div>
        </div>
      </Pane4Section>

      <Pane4Section id="task-memo" title="メモ">
        <InlineTextareaField
          value={task.memo ?? ""}
          onSave={(v) => onUpdateTask({ memo: v })}
          ariaLabel="メモ"
        />
      </Pane4Section>
    </div>
  );
}

function VehicleReportDetail({
  task,
  profile,
  onUpdateTask,
  onUpdateProfile,
  onUpdateOpenDate,
  onUpdateFirstDeliveryDate,
}: {
  task: Task;
  profile: StoreProfile;
  onUpdateTask: (updates: Partial<Task>) => void;
  onUpdateProfile: (updates: Partial<StoreProfile>) => void;
  onUpdateOpenDate: (v: string) => void;
  onUpdateFirstDeliveryDate: (v: string) => void;
}) {
  const update = <K extends keyof StoreProfile>(
    key: K,
    value: StoreProfile[K],
  ) => onUpdateProfile({ [key]: value });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 px-5 py-3">
        <Badge variant="outline">号車報告書</Badge>
        <span className="text-xs text-muted-foreground">
          全項目入力で報告書完成
        </span>
      </div>

      {/* タスク情報 */}
      <Pane4Section id="vr-meta" title="タスク情報">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="期日">
            <InlineDateField
              value={task.dueDate}
              onSave={(v) => onUpdateTask({ dueDate: v })}
              ariaLabel="期日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="ステータス">
            <StatusToggleGroup
              value={task.status}
              onChange={(v) => onUpdateTask({ status: v })}
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

      {/* フラットフィールドリスト（セクションヘッダーなし） */}
      <div className="px-5 py-3">
        <dl className="flex flex-col gap-2.5 text-sm">
          {/* ── 基本情報 ── */}
          <InlineFieldRow
            label="得意先CD"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.customerCode}
              onSave={(v) => update("customerCode", v)}
              ariaLabel="得意先CD"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="店名"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.name}
              onSave={(v) => update("name", v)}
              ariaLabel="店名"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="業態"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.businessType}
              onSave={(v) => update("businessType", v)}
              ariaLabel="業態"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="住所"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.address}
              onSave={(v) => update("address", v)}
              ariaLabel="住所"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="電話番号"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.phone}
              onSave={(v) => update("phone", v)}
              ariaLabel="電話番号"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="店長"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.managerName}
              onSave={(v) => update("managerName", v)}
              ariaLabel="店長"
            />
          </InlineFieldRow>

          <Separator />

          {/* ── 配送・営業 ── */}
          <InlineFieldRow
            label="支払い"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <OptionToggleGroup
              value={profile.paymentMethod}
              options={["現金", "振込"] as const}
              onChange={(v) => update("paymentMethod", v)}
              ariaLabelPrefix="支払方法"
            />
          </InlineFieldRow>

          <Separator />

          <InlineFieldRow
            label="集金担当者"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.collectionPerson}
              onSave={(v) => update("collectionPerson", v)}
              ariaLabel="集金担当者"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="号車納品時間"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <div className="flex items-center gap-1.5">
              <InlineTextField
                value={profile.deliveryTimeStart}
                onSave={(v) => update("deliveryTimeStart", v)}
                ariaLabel="納品開始"
              />
              <span className="shrink-0 text-xs text-muted-foreground">〜</span>
              <InlineTextField
                value={profile.deliveryTimeEnd}
                onSave={(v) => update("deliveryTimeEnd", v)}
                ariaLabel="納品終了"
              />
            </div>
          </InlineFieldRow>
          <InlineFieldRow
            label="店舗出勤時間"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-xs text-muted-foreground">平日</span>
              <InlineTextField
                value={profile.customerWorkStartWeekday}
                onSave={(v) => update("customerWorkStartWeekday", v)}
                ariaLabel="出勤時間（平日）"
              />
              <span className="shrink-0 text-xs text-muted-foreground">土日</span>
              <InlineTextField
                value={profile.customerWorkStartWeekend}
                onSave={(v) => update("customerWorkStartWeekend", v)}
                ariaLabel="出勤時間（土日）"
              />
            </div>
          </InlineFieldRow>
          <InlineFieldRow
            label="鍵預かり"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <div className="flex flex-col gap-1.5">
              <OptionToggleGroup
                value={profile.keyCustodyType}
                options={["あり", "キーボックス", "なし"] as const}
                onChange={(v) => update("keyCustodyType", v)}
                ariaLabelPrefix="鍵預かり"
              />
              {profile.keyCustodyType === "キーボックス" && (
                <InlineTextField
                  value={profile.keyboxCode}
                  onSave={(v) => update("keyboxCode", v)}
                  ariaLabel="キーボックス番号"
                />
              )}
            </div>
          </InlineFieldRow>
          <InlineFieldRow
            label="サーバー設置日"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineDateField
              value={profile.serverInstallDate}
              onSave={(v) => update("serverInstallDate", v)}
              ariaLabel="サーバー設置日"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="初回納品"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineDateField
              value={profile.firstDeliveryDate}
              onSave={onUpdateFirstDeliveryDate}
              ariaLabel="初回納品日"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="オープン日"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineDateField
              value={profile.openDate}
              onSave={onUpdateOpenDate}
              ariaLabel="オープン日"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="休日"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.holidays}
              onSave={(v) => update("holidays", v)}
              ariaLabel="休日"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="ランチ"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <YesNoToggleGroup
              value={profile.hasLunch}
              onChange={(v) => update("hasLunch", v)}
              ariaLabelPrefix="ランチ"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="伝票の種類"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.invoiceType}
              onSave={(v) => update("invoiceType", v)}
              ariaLabel="伝票の種類"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="たばこ"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <OptionToggleGroup
              value={profile.smokingPolicy}
              options={["禁煙", "分煙", "喫煙"] as const}
              onChange={(v) => update("smokingPolicy", v)}
              ariaLabelPrefix="たばこ"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="注文方法"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineTextField
              value={profile.orderMethod}
              onSave={(v) => update("orderMethod", v)}
              ariaLabel="注文方法"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="売上見込"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <InlineNumberField
              value={profile.expectedSales}
              onSave={(v) => update("expectedSales", v)}
              ariaLabel="売上見込"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="雑瓶回収"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <YesNoToggleGroup
              value={profile.keyCustody}
              onChange={(v) => update("keyCustody", v)}
              ariaLabelPrefix="雑瓶回収"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="オープン区分"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <OptionToggleGroup
              value={profile.openCategory}
              options={["開店", "帳合変更"] as const}
              onChange={(v) => update("openCategory", v)}
              ariaLabelPrefix="オープン区分"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="エレベーター"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <YesNoToggleGroup
              value={profile.elevatorAvailable}
              onChange={(v) => update("elevatorAvailable", v)}
              ariaLabelPrefix="エレベーター"
            />
          </InlineFieldRow>
          <InlineFieldRow
            label="専用搬入口"
            direction="horizontal"
            labelWidth={VR_FIELD_LABEL_WIDTH}
          >
            <YesNoToggleGroup
              value={profile.dedicatedEntrance}
              onChange={(v) => update("dedicatedEntrance", v)}
              ariaLabelPrefix="専用搬入口"
            />
          </InlineFieldRow>
        </dl>
      </div>

      {/* 注意事項・伝達事項 */}
      <Pane4Section id="vr-notes" title="注意事項・伝達事項">
        <InlineTextareaField
          value={profile.notesAndAttachments}
          onSave={(v) => update("notesAndAttachments", v)}
          ariaLabel="注意事項"
        />
        <div className="mt-3 flex flex-col gap-2">
          <Button variant="outline" size="sm" className="w-full">
            写真を添付
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            地図を添付
          </Button>
        </div>
      </Pane4Section>
    </div>
  );
}

export function TaskDetailPane({
  task,
  profile,
  pane4Open,
  onTogglePane4,
  onUpdateTask,
  onUpdateProfile,
  onUpdateOpenDate,
  onUpdateFirstDeliveryDate,
}: TaskDetailPaneProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-background",
        pane4Open ? "w-[400px]" : "w-12",
      )}
    >
      {pane4Open && task ? (
        <>
          <div className="flex shrink-0 items-center gap-2 px-3 pt-2.5 pb-1">
            <EditableTaskName
              key={task.id}
              name={task.name}
              onSave={(v) => onUpdateTask({ name: v })}
            />
            <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4 pt-2">
              {task.kind === "vehicleReport" ? (
                <VehicleReportDetail
                  task={task}
                  profile={profile}
                  onUpdateTask={onUpdateTask}
                  onUpdateProfile={onUpdateProfile}
                  onUpdateOpenDate={onUpdateOpenDate}
                  onUpdateFirstDeliveryDate={onUpdateFirstDeliveryDate}
                />
              ) : (
                <StandardTaskDetail task={task} onUpdateTask={onUpdateTask} />
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex shrink-0 items-center justify-center pt-2">
          <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
        </div>
      )}
    </aside>
  );
}

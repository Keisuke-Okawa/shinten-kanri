"use client";

import { cn } from "@/lib/utils";
import {
  type StoreProfile,
  type Task,
  type TaskStatusKey,
} from "@/lib/schema";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { Pane4Toggle } from "@/components/workspace/Pane4Toggle";
import { Pane4Section } from "@/components/workspace/Pane4Section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InlineTextField,
  InlineDateField,
  InlineSelectField,
  InlineTextareaField,
  InlineFieldRow,
} from "@/components/primitives";

const TASK_STATUS_OPTIONS = ["未着手", "進行中", "完了"] as const;
const PAYMENT_OPTIONS = ["現金", "振込"] as const;
const SMOKING_OPTIONS = ["禁煙", "分煙", "喫煙"] as const;
const YES_NO_OPTIONS = ["有", "無"] as const;

function statusToLabel(status: TaskStatusKey): string {
  if (status === "na") return "対象外";
  return TASK_STATUS_LABELS[status];
}

function labelToStatus(label: string): TaskStatusKey {
  const entry = Object.entries(TASK_STATUS_LABELS).find(([, v]) => v === label);
  return (entry?.[0] as TaskStatusKey) ?? "notStarted";
}

type TaskDetailPaneProps = {
  task: Task | null;
  profile: StoreProfile;
  pane4Open: boolean;
  onTogglePane4: () => void;
  onUpdateTask: (updates: Partial<Task>) => void;
  onUpdateProfile: (updates: Partial<StoreProfile>) => void;
};

function StandardTaskDetail({
  task,
  onUpdateTask,
}: {
  task: Task;
  onUpdateTask: (updates: Partial<Task>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Pane4Section id="task-meta" title="タスク情報">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="タスク名">
            <span className="text-sm text-foreground">{task.name}</span>
          </InlineFieldRow>
          <InlineFieldRow label="期日">
            <InlineDateField
              value={task.dueDate}
              onSave={(v) => onUpdateTask({ dueDate: v })}
              ariaLabel="期日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="ステータス">
            <InlineSelectField
              value={statusToLabel(task.status)}
              options={TASK_STATUS_OPTIONS}
              onSave={(v) => onUpdateTask({ status: labelToStatus(v) })}
              ariaLabel="ステータス"
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

      <Pane4Section id="task-memo" title="メモ">
        <InlineTextareaField
          value={task.memo ?? ""}
          onSave={(v) => onUpdateTask({ memo: v })}
          ariaLabel="メモ"

        />
      </Pane4Section>

      <div className="flex justify-end">
        <Button size="sm">完了にする</Button>
      </div>
    </div>
  );
}

function VehicleReportDetail({
  profile,
  onUpdateProfile,
}: {
  profile: StoreProfile;
  onUpdateProfile: (updates: Partial<StoreProfile>) => void;
}) {
  const update = <K extends keyof StoreProfile>(
    key: K,
    value: StoreProfile[K],
  ) => onUpdateProfile({ [key]: value });

  const boolToLabel = (v: boolean) => (v ? "有" : "無");
  const labelToBool = (v: string) => v === "有";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline">号車報告書</Badge>
        <span className="text-xs text-muted-foreground">
          全項目入力で報告書完成
        </span>
      </div>

      <Pane4Section id="vr-basic" title="基本情報">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="得意先コード">
            <InlineTextField
              value={profile.customerCode}
              onSave={(v) => update("customerCode", v)}
              ariaLabel="得意先コード"
            />
          </InlineFieldRow>
          <InlineFieldRow label="店名">
            <InlineTextField
              value={profile.name}
              onSave={(v) => update("name", v)}
              ariaLabel="店名"
            />
          </InlineFieldRow>
          <InlineFieldRow label="業態">
            <InlineTextField
              value={profile.businessType}
              onSave={(v) => update("businessType", v)}
              ariaLabel="業態"
            />
          </InlineFieldRow>
          <InlineFieldRow label="住所">
            <InlineTextField
              value={profile.address}
              onSave={(v) => update("address", v)}
              ariaLabel="住所"
            />
          </InlineFieldRow>
          <InlineFieldRow label="電話番号">
            <InlineTextField
              value={profile.phone}
              onSave={(v) => update("phone", v)}
              ariaLabel="電話番号"
            />
          </InlineFieldRow>
          <InlineFieldRow label="店長">
            <InlineTextField
              value={profile.managerName}
              onSave={(v) => update("managerName", v)}
              ariaLabel="店長"
            />
          </InlineFieldRow>
          <InlineFieldRow label="オープン日">
            <InlineDateField
              value={profile.openDate}
              onSave={(v) => update("openDate", v)}
              ariaLabel="オープン日"
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

      <Pane4Section id="vr-delivery" title="配送・営業">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="現金or振込">
            <InlineSelectField
              value={profile.paymentMethod}
              options={PAYMENT_OPTIONS}
              onSave={(v) => update("paymentMethod", v)}
              ariaLabel="支払方法"
            />
          </InlineFieldRow>
          {profile.paymentMethod === "現金" && (
            <InlineFieldRow label="集金担当">
              <InlineTextField
                value={profile.collectionPerson}
                onSave={(v) => update("collectionPerson", v)}
                ariaLabel="集金担当"
              />
            </InlineFieldRow>
          )}
          <InlineFieldRow label="納品時間">
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
          <InlineFieldRow label="ランチ">
            <InlineSelectField
              value={boolToLabel(profile.hasLunch)}
              options={YES_NO_OPTIONS}
              onSave={(v) => update("hasLunch", labelToBool(v))}
              ariaLabel="ランチ"
            />
          </InlineFieldRow>
          <InlineFieldRow label="注文方法">
            <InlineTextField
              value={profile.orderMethod}
              onSave={(v) => update("orderMethod", v)}
              ariaLabel="注文方法"
            />
          </InlineFieldRow>
          <InlineFieldRow label="鍵預かり">
            <InlineSelectField
              value={boolToLabel(profile.keyCustody)}
              options={YES_NO_OPTIONS}
              onSave={(v) => update("keyCustody", labelToBool(v))}
              ariaLabel="鍵預かり"
            />
          </InlineFieldRow>
          <InlineFieldRow label="休日">
            <InlineTextField
              value={profile.holidays}
              onSave={(v) => update("holidays", v)}
              ariaLabel="休日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="初回納品日">
            <InlineDateField
              value={profile.firstDeliveryDate}
              onSave={(v) => update("firstDeliveryDate", v)}
              ariaLabel="初回納品日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="たばこ">
            <InlineSelectField
              value={profile.smokingPolicy}
              options={SMOKING_OPTIONS}
              onSave={(v) => update("smokingPolicy", v)}
              ariaLabel="たばこ"
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

      <Pane4Section id="vr-other" title="その他">
        <dl className="flex flex-col gap-2.5 text-sm">
          <InlineFieldRow label="伝票の種類">
            <InlineTextField
              value={profile.invoiceType}
              onSave={(v) => update("invoiceType", v)}
              ariaLabel="伝票の種類"
            />
          </InlineFieldRow>
          <InlineFieldRow label="サーバー設置日">
            <InlineDateField
              value={profile.serverInstallDate}
              onSave={(v) => update("serverInstallDate", v)}
              ariaLabel="サーバー設置日"
            />
          </InlineFieldRow>
          <InlineFieldRow label="エレベーター">
            <InlineSelectField
              value={boolToLabel(profile.elevatorAvailable)}
              options={YES_NO_OPTIONS}
              onSave={(v) => update("elevatorAvailable", labelToBool(v))}
              ariaLabel="エレベーター"
            />
          </InlineFieldRow>
          <InlineFieldRow label="専用搬入口">
            <InlineSelectField
              value={boolToLabel(profile.dedicatedEntrance)}
              options={YES_NO_OPTIONS}
              onSave={(v) => update("dedicatedEntrance", labelToBool(v))}
              ariaLabel="専用搬入口"
            />
          </InlineFieldRow>
        </dl>
      </Pane4Section>

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
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
            <h2 className="flex-1 truncate text-sm font-semibold text-foreground">
              {task.name}
            </h2>
            <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
          </header>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4">
              {task.kind === "vehicleReport" ? (
                <VehicleReportDetail
                  profile={profile}
                  onUpdateProfile={onUpdateProfile}
                />
              ) : (
                <StandardTaskDetail task={task} onUpdateTask={onUpdateTask} />
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-border">
          <Pane4Toggle open={pane4Open} onToggle={onTogglePane4} />
        </div>
      )}
    </aside>
  );
}

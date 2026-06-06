"use client";

import { cn } from "@/lib/utils";
import { type StoreProfile } from "@/lib/schema";
import { PANE2_SECTION } from "@/lib/labels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InlineTextField,
  InlineDateField,
  InlineTextareaField,
  InlineFieldRow,
  InlineTimeField,
  InlineNumberField,
} from "@/components/primitives";

type StoreProfilePaneProps = {
  profile: StoreProfile;
  setProfile: React.Dispatch<React.SetStateAction<StoreProfile>>;
};

function ConditionToggle({
  label,
  pressed,
  onPressedChange,
}: {
  label: string;
  pressed: boolean;
  onPressedChange: (v: boolean) => void;
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      variant="bordered"
      size="sm"
      aria-label={label}
      className="px-3"
    >
      {label}
    </Toggle>
  );
}

export function StoreProfilePane({
  profile,
  setProfile,
}: StoreProfilePaneProps) {
  const update = <K extends keyof StoreProfile>(key: K, value: StoreProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="flex w-[400px] shrink-0 flex-col border-r border-border bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* 基本情報 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.basic}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              <InlineFieldRow label="店名" direction="horizontal">
                <InlineTextField
                  value={profile.name}
                  onSave={(v) => update("name", v)}
                  ariaLabel="店名"
                />
              </InlineFieldRow>
              <InlineFieldRow label="住所" direction="horizontal">
                <InlineTextField
                  value={profile.address}
                  onSave={(v) => update("address", v)}
                  ariaLabel="住所"
                />
              </InlineFieldRow>
              <div className="grid grid-cols-[auto_11fr_auto_9fr] items-center gap-x-2 gap-y-2.5 text-sm">
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">TEL</span>
                <InlineTextField
                  value={profile.phone}
                  onSave={(v) => update("phone", v)}
                  ariaLabel="電話番号"
                  autoComplete="off"
                />
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">CD</span>
                <InlineTextField
                  value={profile.customerCode}
                  onSave={(v) => update("customerCode", v)}
                  ariaLabel="得意先コード"
                />
                <Separator className="col-span-4 my-0" />
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">席数</span>
                <InlineTextField
                  value={profile.seatCount}
                  onSave={(v) => update("seatCount", v)}
                  ariaLabel="席数"
                />
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">客単価</span>
                <InlineNumberField
                  value={profile.avgSpendPerCustomer}
                  onSave={(v) => update("avgSpendPerCustomer", v)}
                  ariaLabel="客単価"
                />
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">休日</span>
                <InlineTextField
                  value={profile.holidays}
                  onSave={(v) => update("holidays", v)}
                  ariaLabel="休日"
                />
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">売上見込</span>
                <InlineNumberField
                  value={profile.expectedSales}
                  onSave={(v) => update("expectedSales", v)}
                  ariaLabel="売上見込"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <InlineFieldRow label="オープン" direction="horizontal">
                  <InlineDateField
                    value={profile.openDate}
                    onSave={(v) => update("openDate", v)}
                    ariaLabel="オープン日"
                    freeText
                  />
                </InlineFieldRow>
                <InlineFieldRow label="初回納品" direction="horizontal">
                  <InlineDateField
                    value={profile.firstDeliveryDate}
                    onSave={(v) => update("firstDeliveryDate", v)}
                    ariaLabel="初回納品日"
                    freeText
                  />
                </InlineFieldRow>
                <InlineFieldRow label="サーバー" direction="horizontal">
                  <InlineDateField
                    value={profile.serverInstallDate}
                    onSave={(v) => update("serverInstallDate", v)}
                    ariaLabel="サーバー設置日"
                    freeText
                  />
                </InlineFieldRow>
                <InlineFieldRow label="引き渡し" direction="horizontal">
                  <InlineDateField
                    value={profile.handoverDate}
                    onSave={(v) => update("handoverDate", v)}
                    ariaLabel="引き渡し日"
                    freeText
                  />
                </InlineFieldRow>
              </div>
            </CardContent>
          </Card>

          {/* 条件設定（時間設定を統合） */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.conditions}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <ConditionToggle
                  label="WEB"
                  pressed={profile.webOrder}
                  onPressedChange={(v) => update("webOrder", v)}
                />
                <ConditionToggle
                  label="雑瓶"
                  pressed={profile.miscBottle}
                  onPressedChange={(v) => update("miscBottle", v)}
                />
                <ConditionToggle
                  label="鍵預かり"
                  pressed={profile.keyCustody}
                  onPressedChange={(v) => update("keyCustody", v)}
                />
                <ConditionToggle
                  label="祝花"
                  pressed={profile.congratulatoryFlowers}
                  onPressedChange={(v) => update("congratulatoryFlowers", v)}
                />
                <ConditionToggle
                  label="代配"
                  pressed={profile.proxyDelivery}
                  onPressedChange={(v) => update("proxyDelivery", v)}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-[auto_auto_5rem_auto_5rem] items-center gap-x-2 gap-y-2.5 text-sm">
                {/* 配送時間 */}
                <span className="shrink-0 text-muted-foreground">配送時間</span>
                <span />
                <InlineTimeField
                  value={profile.deliveryTimeStart}
                  onSave={(v) => update("deliveryTimeStart", v)}
                  ariaLabel="配送開始時間"
                />
                <span className="text-center text-muted-foreground">〜</span>
                <InlineTimeField
                  value={profile.deliveryTimeEnd}
                  onSave={(v) => update("deliveryTimeEnd", v)}
                  ariaLabel="配送終了時間"
                />
                {/* 出勤時間 */}
                <span className="shrink-0 text-muted-foreground">出勤時間</span>
                <span className="shrink-0 text-xs text-muted-foreground">平日</span>
                <InlineTimeField
                  value={profile.customerWorkStartWeekday}
                  onSave={(v) => update("customerWorkStartWeekday", v)}
                  ariaLabel="出勤時間（平日）"
                />
                <span className="text-center text-xs text-muted-foreground">土日</span>
                <InlineTimeField
                  value={profile.customerWorkStartWeekend}
                  onSave={(v) => update("customerWorkStartWeekend", v)}
                  ariaLabel="出勤時間（土日）"
                />
                <Separator className="col-span-5 my-0.5" />
                {/* 営業時間 1 */}
                <span className="shrink-0 text-muted-foreground">営業時間 1</span>
                <span />
                <InlineTimeField
                  value={profile.businessHours1Start}
                  onSave={(v) => update("businessHours1Start", v)}
                  ariaLabel="営業時間1開始"
                />
                <span className="text-center text-muted-foreground">〜</span>
                <InlineTimeField
                  value={profile.businessHours1End}
                  onSave={(v) => update("businessHours1End", v)}
                  ariaLabel="営業時間1終了"
                />
                {/* 営業時間 2 */}
                <span className="shrink-0 text-muted-foreground">営業時間 2</span>
                <span />
                <InlineTimeField
                  value={profile.businessHours2Start}
                  onSave={(v) => update("businessHours2Start", v)}
                  ariaLabel="営業時間2開始"
                />
                <span className="text-center text-muted-foreground">〜</span>
                <InlineTimeField
                  value={profile.businessHours2End}
                  onSave={(v) => update("businessHours2End", v)}
                  ariaLabel="営業時間2終了"
                />
              </div>
            </CardContent>
          </Card>

          {/* メモ */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.memo}</CardTitle>
            </CardHeader>
            <CardContent>
              <InlineTextareaField
                value={profile.pane2Memo}
                onSave={(v) => update("pane2Memo", v)}
                ariaLabel="メモ"
              />
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </section>
  );
}

export function TrafficLightDot({
  light,
  className,
}: {
  light: "green" | "yellow" | "red";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-[15px] shrink-0 rounded-full",
        light === "green" && "bg-traffic-green",
        light === "yellow" && "bg-traffic-yellow",
        light === "red" && "bg-traffic-red",
        className,
      )}
      aria-hidden="true"
    />
  );
}

"use client";

import { cn } from "@/lib/utils";
import { type StoreProfile } from "@/lib/schema";
import { PANE2_SECTION } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
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
  InlineSelectField,
  InlineTextareaField,
  InlineFieldRow,
} from "@/components/primitives";

const PAYMENT_OPTIONS = ["現金", "振込"] as const;
const SMOKING_OPTIONS = ["禁煙", "分煙", "喫煙"] as const;
const ORDER_OPTIONS = ["WEB", "FAX", "電話"] as const;

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
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Toggle
        pressed={pressed}
        onPressedChange={onPressedChange}
        size="sm"
        aria-label={label}
      >
        {pressed ? "ON" : "OFF"}
      </Toggle>
    </div>
  );
}

export function StoreProfilePane({
  profile,
  setProfile,
}: StoreProfilePaneProps) {
  const update = <K extends keyof StoreProfile>(key: K, value: StoreProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="flex w-[320px] shrink-0 flex-col border-r border-border bg-background">
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.basic}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.conditions}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ConditionToggle
                label="WEB注文"
                pressed={profile.webOrder}
                onPressedChange={(v) => update("webOrder", v)}
              />
              <ConditionToggle
                label="代配（代理配送）"
                pressed={profile.proxyDelivery}
                onPressedChange={(v) => update("proxyDelivery", v)}
              />
              <ConditionToggle
                label="祝い花"
                pressed={profile.congratulatoryFlowers}
                onPressedChange={(v) => update("congratulatoryFlowers", v)}
              />
              <Separator />
              <InlineFieldRow label="配送時間">
                <div className="flex items-center gap-1.5">
                  <InlineTextField
                    value={profile.deliveryTimeStart}
                    onSave={(v) => update("deliveryTimeStart", v)}
                    ariaLabel="配送開始"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">〜</span>
                  <InlineTextField
                    value={profile.deliveryTimeEnd}
                    onSave={(v) => update("deliveryTimeEnd", v)}
                    ariaLabel="配送終了"
                  />
                </div>
              </InlineFieldRow>
              <InlineFieldRow label="出勤時間">
                <InlineTextField
                  value={profile.customerWorkStart}
                  onSave={(v) => update("customerWorkStart", v)}
                  ariaLabel="出勤時間"
                />
              </InlineFieldRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>{PANE2_SECTION.delivery}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
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
              <InlineFieldRow label="注文方法">
                <InlineSelectField
                  value={profile.orderMethod}
                  options={ORDER_OPTIONS}
                  onSave={(v) => update("orderMethod", v)}
                  ariaLabel="注文方法"
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
              <InlineFieldRow label="休日">
                <InlineTextField
                  value={profile.holidays}
                  onSave={(v) => update("holidays", v)}
                  ariaLabel="休日"
                />
              </InlineFieldRow>
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

"use client";

import { useRef, useState } from "react";

import { type StoreProfile } from "@/lib/schema";
import { PANE2_SECTION } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";

// ── デフォルトプロフィール ──────────────────────────────────────
// WEB・雑瓶 = ON、それ以外のトグルは OFF、テキストはすべて空

const EMPTY_PROFILE: StoreProfile = {
  customerCode: "",
  name: "",
  companyName: "",
  businessType: "",
  address: "",
  phone: "",
  managerName: "",
  paymentMethod: "",
  collectionPerson: "",
  deliveryTimeStart: "",
  deliveryTimeEnd: "",
  hasLunch: false,
  orderMethod: "",
  holidays: "",
  miscCollection: false,
  miscCollectionStart: "",
  firstDeliveryDate: "",
  openDate: "",
  smokingPolicy: "",
  deliveryNotes: "",
  specialNotes: "",
  invoiceType: "",
  serverInstallDate: "",
  handoverDate: "",
  accountChangeEmptyReturn: false,
  elevatorAvailable: false,
  dedicatedEntrance: false,
  notesAndAttachments: "",
  seatCount: "",
  avgSpendPerCustomer: "",
  expectedSales: "",
  webOrder: true,
  sponsorship: false,
  newStore: false,
  miscBottle: true,
  keyCustody: false,
  congratulatoryFlowers: false,
  proxyDelivery: false,
  customerWorkStartWeekday: "",
  customerWorkEndWeekday: "",
  customerWorkStartWeekend: "",
  customerWorkEndWeekend: "",
  pane2Memo: "",
};

// ── Enter キーで次フィールドにフォーカス移動 ───────────────────
// INPUT 上で Enter が押されたとき、フォーム内の次の input/textarea にフォーカスする
// （DOM 順 = グリッド内は左→右→下 の自然順）

function focusNextInput(container: HTMLElement, current: HTMLElement) {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled])",
    ),
  );
  const idx = focusable.indexOf(current);
  if (idx >= 0 && idx < focusable.length - 1) {
    focusable[idx + 1].focus();
  }
}

// ── 時間整形ユーティリティ ─────────────────────────────────────
// "1000" → "10:00" / "930" → "09:30" / すでに "HH:MM" ならそのまま

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  if (digits.length === 2) return `${digits}:00`;
  return raw;
}

type TimeInputProps = {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
};

function TimeInput({ value, onChange, ariaLabel }: TimeInputProps) {
  const [raw, setRaw] = useState(value);

  const commit = () => {
    if (!raw) return;
    const formatted = formatTimeInput(raw);
    setRaw(formatted);
    onChange(formatted);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      aria-label={ariaLabel}
    />
  );
}

// ── メインコンポーネント ───────────────────────────────────────

type AddStoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStore: (profile: StoreProfile) => void;
};

export function AddStoreDialog({
  open,
  onOpenChange,
  onAddStore,
}: AddStoreDialogProps) {
  const [profile, setProfile] = useState<StoreProfile>(EMPTY_PROFILE);

  // IME変換中フラグ。
  // macOS では compositionend が keydown より先に発火するため isComposing だけでは
  // 変換確定のEnterを捕捉できない。compositionstart で立て、keydown でリセットする。
  const composingRef = useRef(false);

  const update = <K extends keyof StoreProfile>(key: K, value: StoreProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    const trimmedName = profile.name.trim();
    if (!trimmedName) return;
    onAddStore({ ...profile, name: trimmedName });
    setProfile(EMPTY_PROFILE);
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setProfile(EMPTY_PROFILE);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
       * DialogContent は grid のまま（3行: header / content / footer）。
       * スクロールしたい中央 div に max-height を直接指定し、
       * overflow-y-auto で確実にスクロールさせる。
       * ヘッダー(~57px) + フッター(~69px) ≈ 8rem を差し引いた残りを使う。
       */}
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>店舗を追加</DialogTitle>
        </DialogHeader>

        {/* スクロール可能なフォーム本体 — Enter で次フィールドへ（IME変換中は除外） */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(85vh - 8rem)" }}
        >
          <div
            className="flex flex-col gap-4 px-6 py-4"
            onCompositionStart={() => { composingRef.current = true; }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              // isComposing: Chrome では変換確定Enterでも true のままなので有効
              // composingRef: macOS/Safari では compositionend が先に来て
              //               isComposing が false になっているケースをカバー
              if (e.nativeEvent.isComposing || composingRef.current) {
                composingRef.current = false; // 次のEnterは移動を許可する
                return;
              }
              const target = e.target as HTMLElement;
              if (target.tagName !== "INPUT") return;
              e.preventDefault();
              focusNextInput(e.currentTarget, target);
            }}
          >
            {/* ── 基本情報 ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{PANE2_SECTION.basic}</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="add-name">店名 *</FieldLabel>
                    <Input
                      id="add-name"
                      autoFocus
                      value={profile.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="add-address">住所</FieldLabel>
                    <Input
                      id="add-address"
                      value={profile.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </Field>

                  {/* TEL + CDコード */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="add-phone">TEL</FieldLabel>
                      <Input
                        id="add-phone"
                        value={profile.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="add-code">CDコード</FieldLabel>
                      <Input
                        id="add-code"
                        value={profile.customerCode}
                        onChange={(e) => update("customerCode", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* 席数 + 客単価 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="add-seats">席数</FieldLabel>
                      <Input
                        id="add-seats"
                        value={profile.seatCount}
                        onChange={(e) => update("seatCount", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="add-avg-spend">客単価（円）</FieldLabel>
                      <Input
                        id="add-avg-spend"
                        value={profile.avgSpendPerCustomer}
                        onChange={(e) => update("avgSpendPerCustomer", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* 休日 + 売上見込 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="add-holidays">休日</FieldLabel>
                      <Input
                        id="add-holidays"
                        value={profile.holidays}
                        onChange={(e) => update("holidays", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="add-expected-sales">売上見込（円）</FieldLabel>
                      <Input
                        id="add-expected-sales"
                        value={profile.expectedSales}
                        onChange={(e) => update("expectedSales", e.target.value)}
                      />
                    </Field>
                  </div>

                  <Separator />

                  {/* オープン日 + 初回納品日 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="add-open-date">オープン日</FieldLabel>
                      <Input
                        id="add-open-date"
                        value={profile.openDate}
                        onChange={(e) => update("openDate", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="add-first-delivery">初回納品日</FieldLabel>
                      <Input
                        id="add-first-delivery"
                        value={profile.firstDeliveryDate}
                        onChange={(e) => update("firstDeliveryDate", e.target.value)}
                      />
                    </Field>
                  </div>

                  {/* サーバー設置日 + 引き渡し日 */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="add-server-date">サーバー設置日</FieldLabel>
                      <Input
                        id="add-server-date"
                        value={profile.serverInstallDate}
                        onChange={(e) => update("serverInstallDate", e.target.value)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="add-handover-date">引き渡し日</FieldLabel>
                      <Input
                        id="add-handover-date"
                        value={profile.handoverDate}
                        onChange={(e) => update("handoverDate", e.target.value)}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* ── 条件設定 ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{PANE2_SECTION.conditions}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {/* トグル群 */}
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-muted-foreground">本部</span>
                    <ConditionToggle
                      label="WEB"
                      pressed={profile.webOrder}
                      onPressedChange={(v) => update("webOrder", v)}
                    />
                    <ConditionToggle
                      label="協賛"
                      pressed={profile.sponsorship}
                      onPressedChange={(v) => update("sponsorship", v)}
                    />
                    <ConditionToggle
                      label="新規"
                      pressed={profile.newStore}
                      onPressedChange={(v) => update("newStore", v)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-muted-foreground">新店</span>
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
                </div>

                <Separator />

                {/* 時間設定：4桁数字 + Enter/blur で HH:MM に整形 */}
                <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-3 gap-y-3 text-sm">
                  <span className="shrink-0 text-muted-foreground">配送時間</span>
                  <TimeInput
                    key={`delivery-start-${open}`}
                    value={profile.deliveryTimeStart}
                    onChange={(v) => update("deliveryTimeStart", v)}
                    ariaLabel="配送開始時間"
                  />
                  <span className="text-center text-muted-foreground">〜</span>
                  <TimeInput
                    key={`delivery-end-${open}`}
                    value={profile.deliveryTimeEnd}
                    onChange={(v) => update("deliveryTimeEnd", v)}
                    ariaLabel="配送終了時間"
                  />

                  <span className="shrink-0 text-muted-foreground">出勤時間</span>
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-xs text-muted-foreground">平日</span>
                    <TimeInput
                      key={`work-weekday-${open}`}
                      value={profile.customerWorkStartWeekday}
                      onChange={(v) => update("customerWorkStartWeekday", v)}
                      ariaLabel="出勤時間（平日）"
                    />
                  </div>
                  <span className="text-center text-xs text-muted-foreground">土日</span>
                  <TimeInput
                    key={`work-weekend-${open}`}
                    value={profile.customerWorkStartWeekend}
                    onChange={(v) => update("customerWorkStartWeekend", v)}
                    ariaLabel="出勤時間（土日）"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── メモ ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{PANE2_SECTION.memo}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={profile.pane2Memo}
                  onChange={(e) => update("pane2Memo", e.target.value)}
                  rows={4}
                  aria-label="メモ"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <DialogClose render={<Button variant="outline">キャンセル</Button>} />
          <Button onClick={handleSubmit} disabled={!profile.name.trim()}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

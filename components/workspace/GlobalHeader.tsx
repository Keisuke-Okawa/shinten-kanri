"use client";

import { useState } from "react";
import { Settings } from "lucide-react";

import {
  DEFAULT_URGENCY_SETTINGS,
  type UrgencySettings,
} from "@/lib/urgencySettings";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type GlobalHeaderProps = {
  storeName: string;
  urgencySettings: UrgencySettings;
  onSaveUrgencySettings: (s: UrgencySettings) => void;
};

function UrgencySettingsForm({
  initial,
  onSave,
  onClose,
}: {
  initial: UrgencySettings;
  onSave: (s: UrgencySettings) => void;
  onClose: () => void;
}) {
  const [redDays, setRedDays] = useState(String(initial.redDays));
  const [yellowDays, setYellowDays] = useState(String(initial.yellowDays));

  const redNum = Math.max(1, parseInt(redDays, 10) || 1);
  const yellowNum = Math.max(redNum + 1, parseInt(yellowDays, 10) || redNum + 1);
  const isValid = !isNaN(parseInt(redDays, 10)) && !isNaN(parseInt(yellowDays, 10)) && yellowNum > redNum;

  function handleSave() {
    if (!isValid) return;
    onSave({ redDays: redNum, yellowDays: yellowNum });
    onClose();
  }

  function handleReset() {
    setRedDays(String(DEFAULT_URGENCY_SETTINGS.redDays));
    setYellowDays(String(DEFAULT_URGENCY_SETTINGS.yellowDays));
  }

  return (
    <div className="flex flex-col gap-5">
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

export function GlobalHeader({
  storeName,
  urgencySettings,
  onSaveUrgencySettings,
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
            <DialogTitle>緊急度の設定</DialogTitle>
          </DialogHeader>
          <UrgencySettingsForm
            initial={urgencySettings}
            onSave={onSaveUrgencySettings}
            onClose={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </header>
  );
}

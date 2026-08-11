"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { type TabelogStoreData } from "@/lib/tabelog/parseTabelogHtml";
import { fetchTabelogStoreAction } from "@/app/workspace/shinten/actions";
import { type StoreProfile } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  /** 読み込んだデータを呼び出し元に渡す。phone は含まない。openingHours は pane2Memo に変換済み */
  onImport: (patch: Partial<StoreProfile>) => void;
};

/**
 * 食べログURLを入力して基本情報を自動入力するフィールド。
 * AddStoreDialog（カード内インライン）と StoreProfilePane（Popover内）で共有する。
 */
export function TabelogImportField({ onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await fetchTabelogStoreAction(trimmed);
      if (result.ok) {
        const { openingHours, ...rest } = result.data;
        const patch: Partial<StoreProfile> = {
          ...(rest.name !== undefined && { name: rest.name }),
          ...(rest.address !== undefined && { address: rest.address }),
          ...(rest.seatCount !== undefined && { seatCount: rest.seatCount }),
          ...(rest.holidays !== undefined && { holidays: rest.holidays }),
          ...(rest.avgSpendPerCustomer !== undefined && {
            avgSpendPerCustomer: rest.avgSpendPerCustomer,
          }),
          ...(openingHours !== undefined && { pane2Memo: `【営業時間】\n${openingHours}` }),
        };
        onImport(patch);
        setStatus({
          type: "success",
          message: "読み込みました。取れなかった項目は手入力してください。",
        });
        setUrl("");
      } else {
        setStatus({ type: "error", message: result.error });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          placeholder="https://tabelog.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleImport();
            }
          }}
          disabled={loading}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleImport()}
          disabled={loading || !url.trim()}
        >
          <Link2 className="size-3.5" />
          {loading ? "読込中…" : "読み込む"}
        </Button>
      </div>
      {status && (
        <p
          className={cn("text-xs", {
            "text-muted-foreground": status.type === "success",
            "text-destructive": status.type === "error",
          })}
        >
          {status.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        食べログの店舗ページURLのみ。取れない項目は手入力してください。
      </p>
    </div>
  );
}

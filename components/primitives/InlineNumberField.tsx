"use client";

/**
 * InlineNumberField — 数値入力プリミティブ。
 *
 * InlineTextField と同じ操作感（blur/Enter で保存、Esc でキャンセル）に加え、
 * 保存時に数値を 3 桁カンマ区切りフォーマットに変換する:
 *   "2000"   → "2,000"
 *   "168000" → "168,000"
 *   "2,000"  → "2,000"（既フォーマット済みも正規化）
 *   ""       → ""（空はそのまま）
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatWithComma(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ja-JP");
}

export type InlineNumberFieldProps = {
  value: string;
  onSave: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
};

export function InlineNumberField({
  value,
  onSave,
  ariaLabel,
  placeholder,
  className,
}: InlineNumberFieldProps) {
  const formatted = formatWithComma(value);

  const save = (raw: string) => {
    const next = formatWithComma(raw);
    if (next !== formatted) onSave(next);
  };

  return (
    <Input
      type="text"
      defaultValue={formatted}
      placeholder={placeholder ?? "未設定"}
      aria-label={ariaLabel}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          (e.target as HTMLInputElement).value = formatted;
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn("h-8 bg-card", className)}
    />
  );
}

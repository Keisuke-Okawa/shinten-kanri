"use client";

/**
 * InlineTimeField — 時刻入力プリミティブ。
 *
 * InlineTextField と同じ操作感（blur/Enter で保存、Esc でキャンセル）に加え、
 * 保存時に入力値を "HH:MM" 形式に自動フォーマットする:
 *   "1000" → "10:00"
 *   "900"  → "09:00"
 *   "930"  → "09:30"
 *   "10:00"（既フォーマット済み）→ "10:00"
 *   ""     → ""（空はそのまま）
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatTime(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const padded = digits.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

export type InlineTimeFieldProps = {
  value: string;
  onSave: (v: string) => void;
  ariaLabel: string;
  className?: string;
};

export function InlineTimeField({
  value,
  onSave,
  ariaLabel,
  className,
}: InlineTimeFieldProps) {
  const save = (raw: string) => {
    const formatted = formatTime(raw);
    if (formatted !== value) onSave(formatted);
  };

  return (
    <Input
      type="text"
      defaultValue={value}
      placeholder="--:--"
      aria-label={ariaLabel}
      onBlur={(e) => save(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          (e.target as HTMLInputElement).value = value;
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn("h-8 w-20 bg-card", className)}
    />
  );
}

"use client";

/**
 * InlineTimeField — 時刻入力プリミティブ。
 *
 * - 3〜4桁の数字（全角可）を Enter/blur で "HH:MM" に自動フォーマット
 *   "1000" → "10:00" / "900" → "09:00" / "１０３０" → "10:30"
 * - Enter 後は右隣 → 次行左端の順で [data-time-field] を持つ次入力へフォーカス移動
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30),
  );
}

function formatTime(raw: string): string {
  const digits = toHalfWidth(raw).replace(/[^0-9]/g, "");
  if (!digits) return "";
  const padded = digits.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

function focusNextTimeField(current: HTMLInputElement) {
  const all = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-time-field]"),
  );
  const next = all[all.indexOf(current) + 1];
  if (next) {
    next.focus();
    next.select();
  } else {
    current.blur();
  }
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
  return (
    <Input
      type="text"
      defaultValue={value}
      placeholder="--:--"
      aria-label={ariaLabel}
      data-time-field
      onBlur={(e) => {
        const formatted = formatTime(e.target.value);
        if (formatted !== value) onSave(formatted);
      }}
      onKeyDown={(e) => {
        const input = e.target as HTMLInputElement;
        if (e.key === "Enter") {
          e.preventDefault();
          const formatted = formatTime(input.value);
          input.value = formatted || input.value;
          if (formatted !== value) onSave(formatted);
          focusNextTimeField(input);
        } else if (e.key === "Escape") {
          input.value = value;
          input.blur();
        }
      }}
      className={cn("h-8 w-20 bg-card", className)}
    />
  );
}

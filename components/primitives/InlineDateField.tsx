"use client";

/**
 * InlineDateField — Pane 4 編集 UI の「日付 input」プリミティブ。
 *
 * 2 つのモードを持つ:
 *
 * デフォルト（freeText=false）:
 *   - `<Popover>` + `<Calendar>` のカレンダー専用トリガー
 *   - 保存形式は ISO 8601（YYYY-MM-DD）。表示は「M月D日」
 *
 * freeText=true:
 *   - テキスト入力欄（自由入力）+ 右端のカレンダーアイコンボタンの 2 要素構成
 *   - 直接入力: blur/Enter で保存、Esc でキャンセル
 *   - カレンダー選択: 「M月D日」形式に変換して保存
 */

import { useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDisplayDate, formatISODate, parseISODate } from "@/lib/computed/profile";

export type InlineDateFieldProps = {
  /** ISO 8601 (YYYY-MM-DD) 形式の文字列。空で「日付を選択」placeholder */
  value: string;
  /** 値が変わったとき呼ばれる */
  onSave: (v: string) => void;
  /** スクリーンリーダー向けラベル */
  ariaLabel: string;
  /**
   * true にするとテキスト直接入力 + カレンダーアイコンボタンの UI になる。
   * カレンダー選択時は「M月D日」形式で保存する。
   */
  freeText?: boolean;
};

function FreeTextDateField({
  value,
  onSave,
  ariaLabel,
}: Omit<InlineDateFieldProps, "freeText">) {
  const displayValue = formatDisplayDate(value) || value;
  const [inputVal, setInputVal] = useState(displayValue);
  const [open, setOpen] = useState(false);
  const composingRef = useRef(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex h-8 w-full overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <PopoverTrigger
          aria-label={`${ariaLabel}カレンダー`}
          className="flex size-8 shrink-0 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-accent/40"
        >
          <CalendarIcon className="size-4" />
        </PopoverTrigger>
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={() => {
            if (inputVal !== value) onSave(inputVal);
          }}
          onCompositionStart={() => { composingRef.current = true; }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.nativeEvent.isComposing || composingRef.current) {
                composingRef.current = false;
                return;
              }
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setInputVal(displayValue);
              e.currentTarget.blur();
            }
          }}
          placeholder="未設定"
          aria-label={ariaLabel}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={parseISODate(value)}
          onSelect={(d) => {
            const formatted = formatDisplayDate(formatISODate(d));
            setInputVal(formatted);
            if (formatted !== value) onSave(formatted);
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(1925, 0)}
          endMonth={new Date(2050, 11)}
          defaultMonth={parseISODate(value) ?? new Date()}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function InlineDateField({
  value,
  onSave,
  ariaLabel,
  freeText = false,
}: InlineDateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISODate(value);

  if (freeText) {
    return <FreeTextDateField value={value} onSave={onSave} ariaLabel={ariaLabel} />;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className="flex h-8 w-full items-center justify-start gap-2 rounded-lg border border-input bg-card px-2.5 py-1 text-left text-sm text-foreground transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/50"
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={
            value
              ? "truncate text-foreground"
              : "truncate text-muted-foreground"
          }
        >
          {value ? formatDisplayDate(value) : "日付を選択"}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            const next = formatISODate(d);
            if (next !== value) onSave(next);
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(1925, 0)}
          endMonth={new Date(2050, 11)}
          defaultMonth={selected ?? new Date()}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

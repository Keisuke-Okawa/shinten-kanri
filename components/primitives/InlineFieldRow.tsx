/**
 * InlineFieldRow — ラベル + 値の縦積み行プリミティブ。
 *
 * Pane 3 / Pane 4 のフォーム系セクションで「ラベル + Inline*Field」を
 * 並べる用途で再利用する MUST。dl/dt/dd セマンティクスで a11y を確保。
 *
 * 利用例:
 *   <dl className="flex flex-col gap-2.5 text-sm">
 *     <InlineFieldRow label="名前">
 *       <InlineTextField value={name} onSave={...} ariaLabel="名前" />
 *     </InlineFieldRow>
 *     <InlineFieldRow label="生年月日">
 *       <InlineDateField value={birthday} onSave={...} ariaLabel="生年月日" />
 *     </InlineFieldRow>
 *   </dl>
 *
 * 雛形では Pane 3 ヘッダー帯トグル内の「応募情報」/「連絡先」、
 * 採用条件カード、Pane 4 モード 2「基本情報」で使う。
 */

export type InlineFieldRowProps = {
  /** ラベルテキスト */
  label: string;
  /** 値（Inline*Field など） */
  children: React.ReactNode;
  /** レイアウト方向。"horizontal" でラベルと入力欄を同一行に並べる（デフォルト "vertical"） */
  direction?: "vertical" | "horizontal";
};

export function InlineFieldRow({ label, children, direction = "vertical" }: InlineFieldRowProps) {
  if (direction === "horizontal") {
    return (
      <div className="flex items-center gap-2">
        <dt className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">{label}</dt>
        <dd className="min-w-0 flex-1">{children}</dd>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

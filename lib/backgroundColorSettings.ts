export type BgColorPreset = {
  id: string;
  label: string;
  /** カラーピッカーで表示するスウォッチの色（CSS color） */
  swatch: string;
  /** Pane 2・4 の背景 → --background を上書き */
  background: string;
  /**
   * Pane 1 の背景 → --sidebar を上書き。
   * background より ΔL ≈ −0.018、彩度 ×1.3 で「少し濃い」関係を維持する。
   * （既存オフホワイトの sidebar/background 差を模範）
   */
  sidebar: string;
  /**
   * Pane 3 の背景 → --canvas を上書き。
   * background より ΔL ≈ −0.012、彩度 ×1.2 で sidebar より少し薄い濃さ。
   */
  canvas: string;
};

export const BG_COLOR_PRESETS: BgColorPreset[] = [
  {
    id: "default",
    label: "デフォルト",
    swatch: "oklch(0.60 0.02 270)",
    background: "oklch(0.9701 0.0041 91.4464)",
    sidebar: "oklch(0.9526 0.0058 84.5665)", // 既存の --sidebar 値をそのまま使用
    canvas: "oklch(0.958 0.005 88)",
  },
  {
    id: "blue",
    label: "ブルー",
    swatch: "oklch(0.65 0.12 220)",
    background: "oklch(0.965 0.018 220)",
    sidebar: "oklch(0.947 0.023 220)",
    canvas: "oklch(0.953 0.022 220)",
  },
  {
    id: "salmon",
    label: "サーモン",
    swatch: "oklch(0.65 0.14 25)",
    background: "oklch(0.965 0.018 25)",
    sidebar: "oklch(0.947 0.023 25)",
    canvas: "oklch(0.953 0.022 25)",
  },
  {
    id: "green",
    label: "グリーン",
    swatch: "oklch(0.65 0.10 145)",
    background: "oklch(0.965 0.015 145)",
    sidebar: "oklch(0.947 0.020 145)",
    canvas: "oklch(0.953 0.018 145)",
  },
  {
    id: "lime",
    label: "ライム",
    swatch: "oklch(0.80 0.14 115)",
    background: "oklch(0.968 0.020 115)",
    sidebar: "oklch(0.950 0.026 115)",
    canvas: "oklch(0.956 0.024 115)",
  },
  {
    id: "purple",
    label: "パープル",
    swatch: "oklch(0.45 0.13 290)",
    background: "oklch(0.965 0.014 290)",
    sidebar: "oklch(0.947 0.018 290)",
    canvas: "oklch(0.953 0.017 290)",
  },
];

const STORAGE_KEY = "workspace-bg-color";
const DEFAULT_BG_ID = "default";

export function loadBgColorId(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && BG_COLOR_PRESETS.some((p) => p.id === v)) return v;
  } catch {
    // localStorage が使えない環境ではデフォルトを返す
  }
  return DEFAULT_BG_ID;
}

export function saveBgColorId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // 失敗しても UI には影響させない
  }
}

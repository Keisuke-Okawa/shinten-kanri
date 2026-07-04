export type BgColorPreset = {
  id: string;
  label: string;
  /** カラーピッカーで表示するスウォッチの色（CSS color） */
  swatch: string;
  /** ワークスペース背景に適用する --background の値 */
  background: string;
};

export const BG_COLOR_PRESETS: BgColorPreset[] = [
  {
    id: "default",
    label: "デフォルト",
    swatch: "oklch(0.60 0.02 270)",
    background: "oklch(0.9701 0.0041 91.4464)",
  },
  {
    id: "blue",
    label: "ブルー",
    swatch: "oklch(0.65 0.12 220)",
    background: "oklch(0.965 0.018 220)",
  },
  {
    id: "salmon",
    label: "サーモン",
    swatch: "oklch(0.65 0.14 25)",
    background: "oklch(0.965 0.018 25)",
  },
  {
    id: "green",
    label: "グリーン",
    swatch: "oklch(0.65 0.10 145)",
    background: "oklch(0.965 0.015 145)",
  },
  {
    id: "lime",
    label: "ライム",
    swatch: "oklch(0.80 0.14 115)",
    background: "oklch(0.968 0.020 115)",
  },
  {
    id: "purple",
    label: "パープル",
    swatch: "oklch(0.45 0.13 290)",
    background: "oklch(0.965 0.014 290)",
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

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
   */
  sidebar: string;
  /**
   * Pane 3 の背景 → --canvas を上書き。
   * background より ΔL ≈ −0.012、彩度 ×1.2 で sidebar より少し薄い濃さ。
   */
  canvas: string;
  /**
   * 区切り線・スクロールバー・子タスク丸 → --border / --input を上書き。
   * sidebar より ΔL ≈ −0.05、彩度 ×1.35。同じ色相で視覚的に浮かない。
   */
  border: string;
  /**
   * 進捗バー空欄・バッジ背景（small） → --muted を上書き。
   * canvas より ΔL ≈ −0.04、彩度 ×1.2。
   */
  muted: string;
  /**
   * Pane1 件数バッジ背景 → --secondary を上書き。
   * sidebar より ΔL ≈ −0.045、彩度 ×1.25。
   */
  secondary: string;
  /**
   * Pane1 内セクション区切り → --sidebar-border を上書き。
   * sidebar より ΔL ≈ −0.07、彩度 ×1.5。
   */
  sidebarBorder: string;
};

export const BG_COLOR_PRESETS: BgColorPreset[] = [
  {
    id: "default",
    label: "デフォルト",
    swatch: "oklch(0.60 0.02 270)",
    background: "oklch(0.9701 0.0041 91.4464)",
    sidebar: "oklch(0.9526 0.0058 84.5665)",
    canvas: "oklch(0.958 0.005 88)",
    border: "oklch(0.890 0.010 88.6)",
    muted: "oklch(0.920 0.007 78.3)",
    secondary: "oklch(0.905 0.009 84.6)",
    sidebarBorder: "oklch(0.860 0.008 84.6)",
  },
  {
    id: "blue",
    label: "ブルー",
    swatch: "oklch(0.65 0.12 220)",
    background: "oklch(0.965 0.018 220)",
    sidebar: "oklch(0.947 0.023 220)",
    canvas: "oklch(0.953 0.022 220)",
    border: "oklch(0.895 0.031 220)",
    muted: "oklch(0.913 0.026 220)",
    secondary: "oklch(0.902 0.029 220)",
    sidebarBorder: "oklch(0.880 0.034 220)",
  },
  {
    id: "salmon",
    label: "サーモン",
    swatch: "oklch(0.65 0.14 25)",
    background: "oklch(0.965 0.018 25)",
    sidebar: "oklch(0.947 0.023 25)",
    canvas: "oklch(0.953 0.022 25)",
    border: "oklch(0.895 0.031 25)",
    muted: "oklch(0.913 0.026 25)",
    secondary: "oklch(0.902 0.029 25)",
    sidebarBorder: "oklch(0.880 0.034 25)",
  },
  {
    id: "green",
    label: "グリーン",
    swatch: "oklch(0.65 0.10 145)",
    background: "oklch(0.965 0.015 145)",
    sidebar: "oklch(0.947 0.020 145)",
    canvas: "oklch(0.953 0.018 145)",
    border: "oklch(0.895 0.027 145)",
    muted: "oklch(0.913 0.022 145)",
    secondary: "oklch(0.902 0.025 145)",
    sidebarBorder: "oklch(0.880 0.030 145)",
  },
  {
    id: "lime",
    label: "クリーム",
    swatch: "oklch(0.78 0.10 88)",
    background: "oklch(0.971 0.018 88)",
    sidebar: "oklch(0.953 0.023 88)",
    canvas: "oklch(0.959 0.021 88)",
    border: "oklch(0.897 0.031 88)",
    muted: "oklch(0.915 0.025 88)",
    secondary: "oklch(0.903 0.028 88)",
    sidebarBorder: "oklch(0.882 0.033 88)",
  },
  {
    id: "purple",
    label: "パープル",
    swatch: "oklch(0.45 0.13 290)",
    background: "oklch(0.965 0.014 290)",
    sidebar: "oklch(0.947 0.018 290)",
    canvas: "oklch(0.953 0.017 290)",
    border: "oklch(0.895 0.024 290)",
    muted: "oklch(0.913 0.020 290)",
    secondary: "oklch(0.902 0.023 290)",
    sidebarBorder: "oklch(0.880 0.028 290)",
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

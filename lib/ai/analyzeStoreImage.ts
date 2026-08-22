import { GoogleGenAI } from "@google/genai";

import { type StoreProfile } from "@/lib/schema";

type AnalyzeResult =
  | { ok: true; data: Partial<StoreProfile> }
  | { ok: false; error: string };

/** Gemini が返す JSON の型 */
type GeminiExtracted = {
  name?: string;
  address?: string;
  phone?: string;
  openDate?: string;
  seatCount?: string;
  holidays?: string;
  avgSpendPerCustomer?: string;
  pane2Memo?: string;
};

const SYSTEM_PROMPT = `
あなたは店舗情報を画像から抽出するAIです。
提供された画像（チラシ・名刺・看板・スクリーンショット等）から、以下のフィールドを読み取り、
**必ずJSON形式だけ**で返してください。余分な文章・マークダウン・コードブロックは一切含めないこと。

抽出するフィールド（読み取れない場合は該当キーを省略する）:
- name: 店名（文字列）
- address: 住所（文字列）
- phone: 電話番号（ハイフン付き、例: 03-1234-5678）
- openDate: オープン日（自由テキスト、例: "2025年4月1日" や "4/1"）
- seatCount: 席数（数字のみの文字列、例: "50"）
- holidays: 定休日（自由テキスト、例: "月曜日" や "不定休"）
- avgSpendPerCustomer: 客単価（数字のみの文字列、例: "3000"）
- pane2Memo: その他の補足情報（営業時間・アクセス等。改行は \\n で表現）

JSON例:
{"name":"焼鳥 山田","address":"東京都渋谷区道玄坂1-1-1","phone":"03-1234-5678","openDate":"2025年4月1日","seatCount":"40","pane2Memo":"【営業時間】\\n月〜金 17:00〜24:00\\n土日 12:00〜24:00"}
`.trim();

/**
 * Gemini 2.0 Flash に画像を渡して店舗情報をJSONで抽出する。
 * サーバーサイド（Server Action）からのみ呼ぶこと。
 */
export async function analyzeStoreImage(
  imageBase64: string,
  mimeType: string,
): Promise<AnalyzeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY が設定されていません。" };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const rawText = response.text?.trim() ?? "";
    if (!rawText) {
      return { ok: false, error: "AIから応答を取得できませんでした。" };
    }

    // JSON部分だけ抽出（モデルが余分なテキストを含む場合に備える）
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        ok: false,
        error: "AIの応答からJSON形式のデータを取得できませんでした。",
      };
    }

    const extracted = JSON.parse(jsonMatch[0]) as GeminiExtracted;

    const hasAny = Object.keys(extracted).length > 0;
    if (!hasAny) {
      return {
        ok: false,
        error:
          "画像から店舗情報を読み取れませんでした。画像をご確認ください。",
      };
    }

    const patch: Partial<StoreProfile> = {};
    if (extracted.name) patch.name = extracted.name;
    if (extracted.address) patch.address = extracted.address;
    if (extracted.phone) patch.phone = extracted.phone;
    if (extracted.openDate) patch.openDate = extracted.openDate;
    if (extracted.seatCount) patch.seatCount = extracted.seatCount;
    if (extracted.holidays) patch.holidays = extracted.holidays;
    if (extracted.avgSpendPerCustomer)
      patch.avgSpendPerCustomer = extracted.avgSpendPerCustomer;
    if (extracted.pane2Memo) patch.pane2Memo = extracted.pane2Memo;

    return { ok: true, data: patch };
  } catch (err) {
    console.error("[analyzeStoreImage] Error:", err);
    return {
      ok: false,
      error:
        "画像の解析中にエラーが発生しました。時間をおいて再試行してください。",
    };
  }
}

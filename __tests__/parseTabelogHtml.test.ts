import { describe, it, expect } from "vitest";
import { parseTabelogHtml } from "@/lib/tabelog/parseTabelogHtml";

// ── テスト用フィクスチャ ────────────────────────────────────────────

/** JSON-LD + 店舗基本情報テーブル + 席・設備テーブルを含む最小HTML */
const FIXTURE_FULL = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "テスト食堂",
    "telephone": "+81-3-1234-5678",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "東京都",
      "addressLocality": "港区赤坂",
      "streetAddress": "2-13-8 1F"
    }
  }
  </script>
</head>
<body>
  <table>
    <tr><th>定休日</th><td>月曜日（祝日の場合は翌日）</td></tr>
  </table>
  <table>
    <tr><th>席数</th><td>36席（カウンター10席、テーブル26席）</td></tr>
    <tr><th>予算</th><td>￥6,000〜￥7,999</td></tr>
  </table>
</body>
</html>
`;

/** JSON-LD なし・テーブルのみのフォールバック確認用 */
const FIXTURE_TABLE_ONLY = `
<!DOCTYPE html>
<html lang="ja">
<body>
  <table>
    <tr><th>店名</th><td>サンプル居酒屋</td></tr>
    <tr><th>住所</th><td>大阪府大阪市中央区難波1-1-1 大きな地図を見る 周辺のお店を探す</td></tr>
    <tr><th>予約・お問い合わせ</th><td>06-1234-5678</td></tr>
    <tr><th>定休日</th><td>日曜日</td></tr>
    <tr><th>席数</th><td>50席</td></tr>
    <tr><th>予算</th><td>￥3,000〜￥4,999</td></tr>
  </table>
</body>
</html>
`;

/** 情報が一切ないページ */
const FIXTURE_EMPTY = `<!DOCTYPE html><html><body><p>お探しのページは見つかりませんでした。</p></body></html>`;

// ── テスト ─────────────────────────────────────────────────────────

describe("parseTabelogHtml", () => {
  describe("JSON-LD からの抽出", () => {
    it("店名・住所・電話番号を抽出できる", () => {
      const result = parseTabelogHtml(FIXTURE_FULL);
      expect(result.name).toBe("テスト食堂");
      expect(result.address).toBe("東京都港区赤坂2-13-8 1F");
      // +81-3-xxxx-xxxx → 03-xxxx-xxxx
      expect(result.phone).toBe("03-1234-5678");
    });
  });

  describe("HTML テーブルからの抽出", () => {
    it("席数・定休日・客単価を抽出できる（FULL）", () => {
      const result = parseTabelogHtml(FIXTURE_FULL);
      expect(result.seatCount).toBe("36");
      expect(result.holidays).toBe("月曜日（祝日の場合は翌日）");
      // (6000 + 7999) / 2 = 6999.5 → 7000
      expect(result.avgSpendPerCustomer).toBe("7000");
    });

    it("JSON-LD がない場合もテーブルから6項目すべて取れる", () => {
      const result = parseTabelogHtml(FIXTURE_TABLE_ONLY);
      expect(result.name).toBe("サンプル居酒屋");
      expect(result.address).toBe("大阪府大阪市中央区難波1-1-1");
      expect(result.phone).toBe("06-1234-5678");
      expect(result.holidays).toBe("日曜日");
      expect(result.seatCount).toBe("50");
      // (3000 + 4999) / 2 = 3999.5 → 4000
      expect(result.avgSpendPerCustomer).toBe("4000");
    });
  });

  describe("情報がない場合", () => {
    it("すべて undefined を返す", () => {
      const result = parseTabelogHtml(FIXTURE_EMPTY);
      expect(result.name).toBeUndefined();
      expect(result.address).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.seatCount).toBeUndefined();
      expect(result.holidays).toBeUndefined();
      expect(result.avgSpendPerCustomer).toBeUndefined();
    });
  });

  describe("住所の後処理", () => {
    it("「大きな地図を見る」以降を除去する", () => {
      const result = parseTabelogHtml(FIXTURE_TABLE_ONLY);
      expect(result.address).not.toContain("大きな地図を見る");
    });
  });
});

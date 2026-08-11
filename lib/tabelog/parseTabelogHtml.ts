import * as cheerio from "cheerio";

export type TabelogStoreData = {
  name?: string;
  address?: string;
  seatCount?: string;
  holidays?: string;
  avgSpendPerCustomer?: string;
  openingHours?: string;
};

/** 予算テキスト "¥6,000～¥7,999" から中央値を整数文字列で返す */
function parseBudget(text: string): string | undefined {
  const m = text.match(/[¥￥]([\d,]+)\s*[〜～]\s*[¥￥]([\d,]+)/);
  if (!m) return undefined;
  const lo = parseInt(m[1].replace(/,/g, ""), 10);
  const hi = parseInt(m[2].replace(/,/g, ""), 10);
  return String(Math.round((lo + hi) / 2));
}

/** 席数テキスト "36席（内訳…）" → "36" */
function parseSeatCount(text: string): string | undefined {
  const m = text.match(/(\d+)\s*席/);
  return m ? m[1] : undefined;
}

/** JSON-LD の address オブジェクト or 文字列を単一文字列に正規化 */
function normalizeAddress(addr: unknown): string | undefined {
  if (typeof addr === "string") return addr.trim() || undefined;
  if (addr && typeof addr === "object") {
    const a = addr as Record<string, unknown>;
    const parts = [a.addressRegion, a.addressLocality, a.streetAddress].filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
    return parts.join("") || undefined;
  }
  return undefined;
}

/**
 * openingHoursSpecification 配列を人が読める文字列にまとめる。
 * 例: "月〜金 11:00–15:00 / 月〜金 17:00–23:00"
 */
function formatOpeningHours(specs: unknown[]): string | undefined {
  const dayMap: Record<string, string> = {
    Monday: "月",
    Tuesday: "火",
    Wednesday: "水",
    Thursday: "木",
    Friday: "金",
    Saturday: "土",
    Sunday: "日",
    PublicHolidays: "祝",
  };

  const lines: string[] = [];
  for (const spec of specs) {
    if (!spec || typeof spec !== "object") continue;
    const s = spec as Record<string, unknown>;
    const days = (
      Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek]
    ) as string[];
    const daysStr = days
      .map((d) => {
        const key = d.replace("https://schema.org/", "");
        return dayMap[key] ?? key;
      })
      .join("・");
    const opens = typeof s.opens === "string" ? s.opens : "";
    const closes = typeof s.closes === "string" ? s.closes : "";
    if (daysStr && opens && closes) {
      lines.push(`${daysStr} ${opens}–${closes}`);
    }
  }
  return lines.length > 0 ? lines.join(" / ") : undefined;
}

/**
 * 食べログ店舗ページの HTML 文字列から基本情報を抽出する。
 * 取れなかった項目は undefined のまま返す（呼び出し側で既存値を保持する）。
 */
export function parseTabelogHtml(html: string): TabelogStoreData {
  const $ = cheerio.load(html);
  const result: TabelogStoreData = {};

  // ── 1. JSON-LD（Restaurant / LocalBusiness）──────────────────────
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() ?? "";
      const items: unknown[] = (() => {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? parsed : [parsed];
      })();

      for (const item of items) {
        if (!item || typeof item !== "object") continue;
        const obj = item as Record<string, unknown>;
        const type = obj["@type"];
        if (type !== "Restaurant" && type !== "LocalBusiness") continue;

        if (!result.name && typeof obj.name === "string") {
          result.name = obj.name;
        }
        if (!result.address) {
          result.address = normalizeAddress(obj.address);
        }
        if (!result.openingHours && Array.isArray(obj.openingHoursSpecification)) {
          result.openingHours = formatOpeningHours(obj.openingHoursSpecification);
        }
      }
    } catch {
      // パース失敗は無視して次へ
    }
  });

  // ── 2. HTML テーブル（店舗基本情報・席・設備） ────────────────────
  $("table tr").each((_, row) => {
    const th = $(row).find("th").text().trim();
    const td = $(row).find("td").text().replace(/\s+/g, " ").trim();
    if (!th || !td) return;

    if (!result.name && th === "店名") {
      result.name = td;
    }
    if (!result.address && th.includes("住所")) {
      result.address = td
        .replace(/大きな地図を見る.*$/, "")
        .replace(/周辺のお店を探す.*$/, "")
        .trim();
    }
    if (!result.openingHours && th.includes("営業時間")) {
      result.openingHours = td;
    }
    if (!result.seatCount && th.includes("席数")) {
      const seats = parseSeatCount(td);
      if (seats) result.seatCount = seats;
    }
    if (!result.holidays && th.includes("定休日")) {
      result.holidays = td;
    }
    if (!result.avgSpendPerCustomer && th.includes("予算")) {
      const budget = parseBudget(td);
      if (budget) result.avgSpendPerCustomer = budget;
    }
  });

  // ── 3. DL / DT / DD フォールバック ───────────────────────────────
  $("dl").each((_, dl) => {
    const dts = $(dl).find("dt");
    dts.each((_, dt) => {
      const label = $(dt).text().trim();
      const dd = $(dt).next("dd").text().replace(/\s+/g, " ").trim();
      if (!dd) return;

      if (!result.openingHours && label.includes("営業時間")) {
        result.openingHours = dd;
      }
      if (!result.seatCount && label.includes("席数")) {
        const seats = parseSeatCount(dd);
        if (seats) result.seatCount = seats;
      }
      if (!result.holidays && label.includes("定休日")) {
        result.holidays = dd;
      }
      if (!result.avgSpendPerCustomer && label.includes("予算")) {
        const budget = parseBudget(dd);
        if (budget) result.avgSpendPerCustomer = budget;
      }
    });
  });

  return result;
}

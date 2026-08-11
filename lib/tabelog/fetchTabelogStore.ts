import { parseTabelogHtml, type TabelogStoreData } from "./parseTabelogHtml";
export type { TabelogStoreData };

type FetchResult =
  | { ok: true; data: TabelogStoreData }
  | { ok: false; error: string };

/** 食べログの店舗ページURLかどうかを検証する */
function isValidTabelogUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const validHost =
      u.hostname === "tabelog.com" || u.hostname === "www.tabelog.com";
    // 店舗パス例: /tokyo/A1301/A130101/13000000/
    const validPath = /^\/[a-z]+\/A\d+\/A\d+\/\d+/.test(u.pathname);
    return validHost && validPath;
  } catch {
    return false;
  }
}

/**
 * 食べログ店舗ページURLからHTMLを取得してパースし、基本情報を返す。
 * サーバーサイド（Server Action）からのみ呼ぶこと。
 */
export async function fetchTabelogStore(url: string): Promise<FetchResult> {
  if (!isValidTabelogUrl(url)) {
    return {
      ok: false,
      error:
        "食べログの店舗ページURLを入力してください（例: https://tabelog.com/tokyo/A1308/A130801/13000000/）",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `ページを取得できませんでした（HTTP ${res.status}）。URLを確認するか、手入力してください。`,
      };
    }

    const html = await res.text();
    const data = parseTabelogHtml(html);

    const hasAny = Object.values(data).some(
      (v) => v !== undefined && v !== "",
    );
    if (!hasAny) {
      return {
        ok: false,
        error:
          "ページから情報を読み取れませんでした。食べログ側のHTML構造が変わった可能性があります。手入力してください。",
      };
    }

    return { ok: true, data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: "タイムアウトしました。時間をおいて再試行してください。",
      };
    }
    return {
      ok: false,
      error:
        "ページを取得できませんでした。URLを確認するか、手入力してください。",
    };
  } finally {
    clearTimeout(timer);
  }
}

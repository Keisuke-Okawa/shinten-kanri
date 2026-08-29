import { describe, it, expect } from "vitest";

import { createMinimalStoreProfile, createMinimalTask } from "@/lib/data/factories";
import {
  collectDueAlertItems,
  DUE_ALERT_MAX_LISTED,
  formatDueAlertSubject,
  formatDueAlertText,
  isJstWeekend,
} from "@/lib/dueAlert";
import { type Store } from "@/lib/schema";

const TODAY = new Date(2026, 7, 23);

function makeStore(
  name: string,
  tasks: Store["tasks"],
  status: Store["status"] = "inProgress",
): Store {
  return {
    id: `store-${name}`,
    status,
    profile: createMinimalStoreProfile(name),
    tasks,
  };
}

function task(id: string, name: string, dueDate: string, status: Store["tasks"][number]["status"] = "notStarted") {
  return { ...createMinimalTask(id, name), dueDate, status };
}

describe("isJstWeekend", () => {
  it("日曜 7 時（JST）は週末", () => {
    expect(isJstWeekend(new Date("2026-08-22T22:00:00.000Z"))).toBe(true);
  });

  it("月曜 7 時（JST）は平日", () => {
    expect(isJstWeekend(new Date("2026-08-23T22:00:00.000Z"))).toBe(false);
  });

  it("土曜 7 時（JST）は週末", () => {
    expect(isJstWeekend(new Date("2026-08-21T22:00:00.000Z"))).toBe(true);
  });
});

describe("collectDueAlertItems", () => {
  it("赤と黄だけを集め、完了店舗・完了タスク・緑は除外する", () => {
    const digest = collectDueAlertItems(
      [
        makeStore("A店", [
          task("r1", "鍵預かり", "2026-08-24"),
          task("y1", "祝花手配", "2026-08-28"),
          task("g1", "Web発注", "2026-09-20"),
          task("c1", "済み", "2026-08-24", "completed"),
        ]),
        makeStore("B店", [task("r2", "取り残し", "2026-08-20")], "completed"),
      ],
      TODAY,
    );

    expect(digest.redCount).toBe(1);
    expect(digest.yellowCount).toBe(1);
    expect(digest.items.map((item) => item.taskName)).toEqual(["鍵預かり", "祝花手配"]);
  });

  it("赤を黄より前に並べる", () => {
    const digest = collectDueAlertItems(
      [
        makeStore("C店", [task("y", "黄タスク", "2026-08-29")]),
        makeStore("D店", [task("r", "赤タスク", "2026-08-22")]),
      ],
      TODAY,
    );

    expect(digest.items.map((item) => item.trafficLight)).toEqual(["red", "yellow"]);
  });

  it("上限を超えた分は extraCount にする", () => {
    const tasks = Array.from({ length: DUE_ALERT_MAX_LISTED + 3 }, (_, i) =>
      task(`t${i}`, `タスク${i}`, "2026-08-24"),
    );
    const digest = collectDueAlertItems([makeStore("大量店", tasks)], TODAY);

    expect(digest.redCount).toBe(DUE_ALERT_MAX_LISTED + 3);
    expect(digest.items).toHaveLength(DUE_ALERT_MAX_LISTED);
    expect(digest.extraCount).toBe(3);
  });
});

describe("formatDueAlertSubject / formatDueAlertText", () => {
  it("本番の件名は件数だけ", () => {
    const digest = collectDueAlertItems(
      [makeStore("A店", [task("r1", "鍵預かり", "2026-08-24")])],
      TODAY,
    );
    expect(formatDueAlertSubject(digest, { isTest: false })).toBe("【新店】赤1 黄0");
  });

  it("テストで対象なしのときは明示する", () => {
    const digest = collectDueAlertItems([], TODAY);
    expect(formatDueAlertSubject(digest, { isTest: true })).toBe("【新店】テスト: 対象なし");
    expect(
      formatDueAlertText(digest, { isTest: true, today: TODAY, appUrl: "" }),
    ).toContain("本番の毎朝通知では、この場合はメールを送りません");
  });

  it("本文に店名・タスク・期日とリンクを入れる", () => {
    const digest = collectDueAlertItems(
      [makeStore("A店", [task("r1", "鍵預かり", "2026-08-24")])],
      TODAY,
    );
    const text = formatDueAlertText(digest, {
      isTest: false,
      today: TODAY,
      appUrl: "https://example.com",
    });

    expect(text).toContain("A店 鍵預かり 〜8/24");
    expect(text).toContain("https://example.com/workspace/shinten");
    expect(text).not.toContain("テスト送信です");
  });
});

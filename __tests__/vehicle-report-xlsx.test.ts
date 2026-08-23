import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

import { createMinimalStoreProfile } from "@/lib/data/factories";
import {
  buildVehicleReportCellValues,
  buildVehicleReportFilename,
  formatDeliveryTime,
  formatKeyCustody,
  formatReportDate,
  formatWorkStartTime,
} from "@/lib/export/vehicle-report-xlsx";

describe("formatDeliveryTime", () => {
  it("開始と終了をスペースでつなぐ", () => {
    expect(formatDeliveryTime("10:00", "12:00")).toBe("10:00 12:00");
  });

  it("片方だけならそれだけ返す", () => {
    expect(formatDeliveryTime("10:00", "")).toBe("10:00");
    expect(formatDeliveryTime("", "12:00")).toBe("12:00");
  });
});

describe("formatWorkStartTime", () => {
  it("平日と土日にラベルを付ける", () => {
    expect(formatWorkStartTime("10:00", "11:00")).toBe("平日 10:00 土日 11:00");
  });

  it("空の側は省略する", () => {
    expect(formatWorkStartTime("10:00", "")).toBe("平日 10:00");
    expect(formatWorkStartTime("", "11:00")).toBe("土日 11:00");
  });
});

describe("formatKeyCustody", () => {
  it("キーボックスかつ番号ありなら番号付きで書く", () => {
    expect(formatKeyCustody("キーボックス", "1234")).toBe(
      "キーボックス番号1234",
    );
  });

  it("キーボックスで番号なしなら種別だけ", () => {
    expect(formatKeyCustody("キーボックス", "")).toBe("キーボックス");
  });

  it("あり・なしはそのまま", () => {
    expect(formatKeyCustody("あり", "")).toBe("あり");
    expect(formatKeyCustody("なし", "")).toBe("なし");
  });
});

describe("formatReportDate", () => {
  it("ISO と M/D を M月D日に揃える", () => {
    expect(formatReportDate("2026-08-14")).toBe("8月14日");
    expect(formatReportDate("8/14")).toBe("8月14日");
    expect(formatReportDate("2026年8月14日")).toBe("8月14日");
    expect(formatReportDate("8月14日")).toBe("8月14日");
  });

  it("空と解釈できない値はそのまま", () => {
    expect(formatReportDate("")).toBe("");
    expect(formatReportDate("未定")).toBe("未定");
  });
});

describe("buildVehicleReportFilename", () => {
  it("CDと店名があるとき両方使う", () => {
    const profile = {
      ...createMinimalStoreProfile("居酒屋山田"),
      customerCode: "A001",
    };
    expect(buildVehicleReportFilename(profile)).toBe(
      "A001_居酒屋山田_号車報告書.xlsx",
    );
  });

  it("CDが空なら店名だけ", () => {
    expect(
      buildVehicleReportFilename(createMinimalStoreProfile("居酒屋山田")),
    ).toBe("居酒屋山田_号車報告書.xlsx");
  });
});

describe("buildVehicleReportCellValues", () => {
  it("指定セルに値を載せ、ありなしを書き、空欄は省略する", () => {
    const profile = {
      ...createMinimalStoreProfile("居酒屋山田"),
      customerCode: "A001",
      vehicleNumber: "12",
      deliveryTimeStart: "10:00",
      deliveryTimeEnd: "12:00",
      customerWorkStartWeekday: "9:00",
      customerWorkStartWeekend: "10:00",
      keyCustodyType: "キーボックス",
      keyboxCode: "9999",
      serverInstallDate: "8/14",
      firstDeliveryDate: "2026-08-14",
      openDate: "2026-08-18",
      hasLunch: true,
      elevatorAvailable: false,
    };
    const values = buildVehicleReportCellValues(profile);

    expect(values.C2).toBe("A001");
    expect(values.D2).toBe("居酒屋山田");
    expect(values.B1).toBe("12");
    expect(values.B7).toBe("10:00 12:00");
    expect(values.B8).toBe("平日 9:00 土日 10:00");
    expect(values.B9).toBe("キーボックス番号9999");
    expect(values.B10).toBe("8月14日");
    expect(values.B11).toBe("8月14日");
    expect(values.B12).toBe("8月18日");
    expect(values.G8).toBe("あり");
    expect(values.B15).toBe("なし");
    expect(values.B3).toBeUndefined();
  });
});

describe("template xlsx", () => {
  it("テンプレ1枚目に転記できる", async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      Buffer.from(
        await readFile("public/templates/号車報告書_template.xlsx"),
      ) as unknown as import("exceljs").Buffer,
    );
    const sheet = workbook.worksheets[0];
    expect(sheet).toBeDefined();

    const profile = {
      ...createMinimalStoreProfile("居酒屋山田"),
      customerCode: "A001",
    };
    for (const [addr, value] of Object.entries(
      buildVehicleReportCellValues(profile),
    )) {
      sheet.getCell(addr).value = value;
    }

    expect(sheet.getCell("C2").value).toBe("A001");
    expect(sheet.getCell("D2").value).toBe("居酒屋山田");
    expect(sheet.getCell("G8").value).toBe("なし");
  });
});

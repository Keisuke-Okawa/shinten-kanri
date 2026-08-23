import { parseISODate } from "@/lib/computed/profile";
import type { StoreProfile } from "@/lib/schema";

const TEMPLATE_PATH = "/templates/号車報告書_template.xlsx";

/** 地図: A19:D19 / 外観: E19:G19。結合セルの中央・枠の 90% */
const IMAGE_INSET = 0.05;

export type VehicleReportImages = {
  mapImageUrl?: string | null;
  exteriorImageUrl?: string | null;
};

export function formatDeliveryTime(start: string, end: string): string {
  return [start, end]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" ");
}

export function formatWorkStartTime(weekday: string, weekend: string): string {
  const parts: string[] = [];
  const wd = weekday.trim();
  const we = weekend.trim();
  if (wd) parts.push(`平日 ${wd}`);
  if (we) parts.push(`土日 ${we}`);
  return parts.join(" ");
}

export function formatKeyCustody(type: string, keyboxCode: string): string {
  if (type === "キーボックス") {
    const code = keyboxCode.trim();
    return code ? `キーボックス番号${code}` : "キーボックス";
  }
  return type.trim();
}

/** 号車報告書の日付欄。ISO / M/D / 年月日を「M月D日」に揃える。解釈できない値はそのまま。 */
export function formatReportDate(raw: string): string {
  const s = raw.trim();
  if (!s) return "";

  const iso = parseISODate(s);
  if (iso) return `${iso.getMonth() + 1}月${iso.getDate()}日`;

  const slash = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slash) return `${Number(slash[1])}月${Number(slash[2])}日`;

  const withYear = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (withYear) return `${Number(withYear[2])}月${Number(withYear[3])}日`;

  const monthDay = s.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDay) return `${Number(monthDay[1])}月${Number(monthDay[2])}日`;

  return s;
}

export function buildVehicleReportCellValues(
  profile: StoreProfile,
): Record<string, string> {
  const values: Record<string, string> = {};
  const put = (addr: string, value: string) => {
    if (value !== "") values[addr] = value;
  };

  put("B1", profile.vehicleNumber.trim());
  put("C2", profile.customerCode.trim());
  put("D2", profile.name.trim());
  put("G2", profile.businessType.trim());
  put("B3", profile.address.trim());
  put("B5", profile.phone.trim());
  put("F5", profile.managerName.trim());
  put("B6", profile.paymentMethod.trim());
  put("F6", profile.collectionPerson.trim());
  put(
    "B7",
    formatDeliveryTime(profile.deliveryTimeStart, profile.deliveryTimeEnd),
  );
  put(
    "B8",
    formatWorkStartTime(
      profile.customerWorkStartWeekday,
      profile.customerWorkStartWeekend,
    ),
  );
  put("B9", formatKeyCustody(profile.keyCustodyType, profile.keyboxCode));
  put("B10", formatReportDate(profile.serverInstallDate));
  put("B11", formatReportDate(profile.firstDeliveryDate));
  put("B12", formatReportDate(profile.openDate));
  put("G7", profile.holidays.trim());
  put("G8", profile.hasLunch ? "あり" : "なし");
  put("G9", profile.invoiceType.trim());
  put("G10", profile.smokingPolicy.trim());
  put("G11", profile.orderMethod.trim());
  put("G12", profile.expectedSales.trim());
  put("B13", profile.miscBottle ? "あり" : "なし");
  put("B14", profile.openCategory.trim());
  put("B15", profile.elevatorAvailable ? "あり" : "なし");
  put("E15", profile.dedicatedEntrance ? "あり" : "なし");
  put("A17", profile.notesAndAttachments.trim());

  return values;
}

export function buildVehicleReportFilename(profile: StoreProfile): string {
  const name = sanitizeFilenamePart(profile.name);
  const code = sanitizeFilenamePart(profile.customerCode);
  if (code && name) return `${code}_${name}_号車報告書.xlsx`;
  if (name) return `${name}_号車報告書.xlsx`;
  if (code) return `${code}_号車報告書.xlsx`;
  return "号車報告書.xlsx";
}

function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function imageExtension(mimeType: string): "png" | "jpeg" | null {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpeg";
  return null;
}

async function fetchImage(
  url: string,
): Promise<{ buffer: ArrayBuffer; extension: "png" | "jpeg" } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  const extension = imageExtension(blob.type);
  if (!extension) return null;
  return { buffer: await blob.arrayBuffer(), extension };
}

function excelColWidthToPx(width: number): number {
  return Math.round(width * 7 + 5);
}

function excelRowHeightToPx(points: number): number {
  return (points * 96) / 72;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function addCenteredImage(
  worksheet: import("exceljs").Worksheet,
  imageId: number,
  colStart1: number,
  colEnd1: number,
  row1: number,
) {
  let frameWidth = 0;
  for (let col = colStart1; col <= colEnd1; col++) {
    frameWidth += excelColWidthToPx(
      Number(worksheet.getColumn(col).width ?? 8.43),
    );
  }
  const frameHeight = excelRowHeightToPx(
    Number(worksheet.getRow(row1).height ?? 15),
  );
  const colSpan = colEnd1 - colStart1 + 1;
  worksheet.addImage(imageId, {
    tl: {
      col: colStart1 - 1 + colSpan * IMAGE_INSET,
      row: row1 - 1 + IMAGE_INSET,
    },
    ext: {
      width: frameWidth * (1 - IMAGE_INSET * 2),
      height: frameHeight * (1 - IMAGE_INSET * 2),
    },
  });
}

export async function downloadVehicleReportXlsx({
  profile,
  mapImageUrl,
  exteriorImageUrl,
}: {
  profile: StoreProfile;
} & VehicleReportImages): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const templateRes = await fetch(encodeURI(TEMPLATE_PATH));
  if (!templateRes.ok) {
    throw new Error("テンプレートの読み込みに失敗しました");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await templateRes.arrayBuffer());
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("テンプレートにシートがありません");
  }

  for (const [addr, value] of Object.entries(
    buildVehicleReportCellValues(profile),
  )) {
    worksheet.getCell(addr).value = value;
  }

  const [mapImage, exteriorImage] = await Promise.all([
    mapImageUrl ? fetchImage(mapImageUrl) : Promise.resolve(null),
    exteriorImageUrl ? fetchImage(exteriorImageUrl) : Promise.resolve(null),
  ]);

  if (mapImage) {
    const id = workbook.addImage({
      base64: arrayBufferToBase64(mapImage.buffer),
      extension: mapImage.extension,
    });
    addCenteredImage(worksheet, id, 1, 4, 19);
  }

  if (exteriorImage) {
    const id = workbook.addImage({
      base64: arrayBufferToBase64(exteriorImage.buffer),
      extension: exteriorImage.extension,
    });
    addCenteredImage(worksheet, id, 5, 7, 19);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = buildVehicleReportFilename(profile);
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

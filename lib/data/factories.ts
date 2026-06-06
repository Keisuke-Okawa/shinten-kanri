/**
 * 店舗・タスクの最小データ生成ヘルパー。
 * 新規追加時のデフォルト値をここに集約する。
 */

import { type StoreProfile, type Task } from "@/lib/schema";

/** 新規店舗プロフィールのデフォルト（名前以外は空） */
export function createMinimalStoreProfile(name: string): StoreProfile {
  return {
    customerCode: "",
    name,
    companyName: "",
    businessType: "",
    address: "",
    phone: "",
    managerName: "",
    paymentMethod: "振込",
    collectionPerson: "",
    deliveryTimeStart: "",
    deliveryTimeEnd: "",
    hasLunch: false,
    orderMethod: "WEB",
    holidays: "",
    miscCollection: false,
    miscCollectionStart: "",
    firstDeliveryDate: "",
    openDate: "",
    smokingPolicy: "禁煙",
    deliveryNotes: "",
    specialNotes: "",
    invoiceType: "納品書",
    serverInstallDate: "",
    handoverDate: "",
    accountChangeEmptyReturn: false,
    elevatorAvailable: false,
    dedicatedEntrance: false,
    notesAndAttachments: "",
    seatCount: "",
    avgSpendPerCustomer: "",
    expectedSales: "",
    webOrder: false,
    sponsorship: false,
    newStore: false,
    miscBottle: false,
    keyCustody: false,
    congratulatoryFlowers: false,
    proxyDelivery: false,
    customerWorkStartWeekday: "",
    customerWorkEndWeekday: "",
    customerWorkStartWeekend: "",
    customerWorkEndWeekend: "",
    pane2Memo: "",
  };
}

/** 新規タスクのデフォルト */
export function createMinimalTask(id: string, name: string): Task {
  return {
    id,
    name,
    kind: "standard",
    status: "notStarted",
    dueDate: "",
  };
}

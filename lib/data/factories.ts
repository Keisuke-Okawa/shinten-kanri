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
    keyCustody: false,
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
    accountChangeEmptyReturn: false,
    elevatorAvailable: false,
    dedicatedEntrance: false,
    notesAndAttachments: "",
    webOrder: false,
    proxyDelivery: false,
    congratulatoryFlowers: false,
    customerWorkStart: "",
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

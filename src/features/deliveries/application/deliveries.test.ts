import { describe, expect, it } from "vitest";
import {
  countDeliveriesInMonth,
  createDeliveryHistoryCsv,
} from "./deliveries";
import { Delivery } from "../domain/delivery";

const deliveries: Delivery[] = [
  {
    id: "1",
    customerName: "山田, 太郎",
    email: "taro@example.com",
    subject: '件名 "確認"',
    sentAt: "2026-07-10T00:00:00.000Z",
    status: "送信済み",
  },
  {
    id: "2",
    customerName: "佐藤",
    email: "sato@example.com",
    subject: "別月",
    sentAt: "2026-06-30T00:00:00.000Z",
    status: "送信済み",
  },
];

describe("delivery utilities", () => {
  it("対象月の送信件数を集計する", () => {
    expect(countDeliveriesInMonth(deliveries, new Date("2026-07-20"))).toBe(1);
  });

  it("BOM付きで引用符をエスケープした履歴CSVを生成する", () => {
    const csv = createDeliveryHistoryCsv(deliveries.slice(0, 1));
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"山田, 太郎"');
    expect(csv).toContain('"件名 ""確認"""');
  });
});

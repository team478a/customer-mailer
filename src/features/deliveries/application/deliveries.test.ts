import { describe, expect, it } from "vitest";
import {
  countDeliveriesInMonth,
  createDeliveryHistoryCsv,
  executeDelivery,
  getRetryableRecipients,
  retryFailedDeliveries,
  reconcileDeliveryBatches,
} from "./deliveries";
import { Delivery } from "../domain/delivery";
import { Customer } from "../../customers/domain/customer";
import { LocalSimulationMailDeliveryService } from "../infrastructure/local-simulation-mail-delivery-service";

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

  it("宛先別結果から一部失敗を判定し、再送対象を抽出する", async () => {
    const customers: Customer[] = [
      {
        id: "customer-1",
        name: "成功",
        email: "success@example.com",
        orderNumber: "A-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "未対応",
      },
      {
        id: "customer-2",
        name: "失敗",
        email: "failure@example.com",
        orderNumber: "A-2",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "未対応",
      },
    ];
    const service = new LocalSimulationMailDeliveryService((input) =>
      input.to === "failure@example.com" ? "一時的な送信エラー" : undefined,
    );
    const { batch, deliveries: results } = await executeDelivery(
      service,
      customers,
      "{{customer_name}}様へのお知らせ",
      "注文番号 {{order_number}}",
      new Date("2026-07-20T00:00:00.000Z"),
    );

    expect(batch.status).toBe("一部失敗");
    expect(results.map((result) => result.status)).toEqual([
      "送信済み",
      "失敗",
    ]);
    expect(getRetryableRecipients(batch).map((recipient) => recipient.email)).toEqual([
      "failure@example.com",
    ]);
  });

  it("選択した失敗宛先だけを再送し、成功済み宛先を変更しない", async () => {
    const failed: Delivery = {
      id: "failed-1",
      customerId: "customer-1",
      customerName: "再送対象",
      email: "retry@example.com",
      subject: "再送テスト",
      body: "本文",
      sentAt: "2026-07-20T00:00:00.000Z",
      status: "失敗",
      errorMessage: "一時エラー",
    };
    const sent: Delivery = {
      id: "sent-1",
      customerName: "成功済み",
      email: "sent@example.com",
      subject: "再送テスト",
      sentAt: "2026-07-20T00:00:00.000Z",
      status: "送信済み",
    };
    const service = new LocalSimulationMailDeliveryService();
    const updated = await retryFailedDeliveries(
      service,
      [failed, sent],
      [failed.id],
      new Date("2026-07-21T00:00:00.000Z"),
    );

    expect(updated[0]).toMatchObject({
      id: "failed-1",
      status: "送信済み",
      retryCount: 1,
      errorMessage: undefined,
    });
    expect(updated[1]).toEqual(sent);
  });

  it("再送結果を配信バッチの状態へ反映する", () => {
    const batch = {
      id: "batch-1",
      subject: "件名",
      body: "本文",
      createdAt: "2026-07-20T00:00:00.000Z",
      status: "一部失敗" as const,
      recipients: [
        {
          id: "recipient-1",
          customerId: "customer-1",
          customerName: "顧客",
          email: "retry@example.com",
          status: "失敗" as const,
        },
      ],
    };
    const updatedDelivery: Delivery = {
      id: "recipient-1",
      batchId: "batch-1",
      customerName: "顧客",
      email: "retry@example.com",
      subject: "件名",
      sentAt: "2026-07-21T00:00:00.000Z",
      status: "送信済み",
    };
    const [updatedBatch] = reconcileDeliveryBatches(
      [batch],
      [updatedDelivery],
      new Date("2026-07-21T00:00:00.000Z"),
    );

    expect(updatedBatch.status).toBe("送信済み");
    expect(updatedBatch.recipients[0].status).toBe("送信済み");
  });
});

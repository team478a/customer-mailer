import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECT_SETTINGS } from "../../settings/domain/project-settings";
import { runDeliveryPreflight } from "./preflight";

const customer = {
  id: "c1",
  name: "山田",
  email: "yamada@example.com",
  orderNumber: "A-1",
  status: "未対応" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("runDeliveryPreflight", () => {
  it("配信停止アドレスを除外し警告する", () => {
    const result = runDeliveryPreflight(
      [customer],
      [{
        id: "s1",
        email: customer.email,
        reason: "配信停止希望",
        createdAt: "2026-01-01T00:00:00.000Z",
      }],
      "件名",
      "本文",
      DEFAULT_PROJECT_SETTINGS,
    );
    expect(result.eligibleCustomers).toHaveLength(0);
    expect(result.excludedCustomers).toHaveLength(1);
    expect(result.errors).toContain(
      "選択した宛先はすべて配信停止リストに登録されています。",
    );
  });

  it("全宛先の差し込み結果を生成する", () => {
    const result = runDeliveryPreflight(
      [customer],
      [],
      "{{customer_name}}様",
      "注文 {{order_number}}",
      DEFAULT_PROJECT_SETTINGS,
    );
    expect(result.previews[0]).toMatchObject({
      subject: "山田様",
      body: expect.stringContaining("注文 A-1"),
    });
  });
});

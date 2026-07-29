import { describe, expect, it } from "vitest";
import { Customer } from "../../customers/domain/customer";
import { personalize } from "./composer";

const customer: Customer = {
  id: "1",
  name: "山田太郎",
  email: "taro@example.com",
  orderNumber: "ORD-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "未対応",
};

describe("personalize", () => {
  it("顧客名と注文番号をすべて置換する", () => {
    expect(
      personalize(
        "{{customer_name}}様 {{order_number}} / {{customer_name}}",
        customer,
      ),
    ).toBe("山田太郎様 ORD-001 / 山田太郎");
  });
});

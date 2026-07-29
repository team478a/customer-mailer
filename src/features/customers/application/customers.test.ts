import { describe, expect, it } from "vitest";
import { addCustomer, hasDuplicateEmail } from "./customers";
import { Customer, MAX_CUSTOMERS } from "../domain/customer";

function customer(index: number): Customer {
  return {
    id: String(index),
    name: `顧客${index}`,
    email: `customer${index}@example.com`,
    orderNumber: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    status: "未対応",
  };
}

describe("customer rules", () => {
  it("大文字小文字を無視してメール重複を判定する", () => {
    expect(hasDuplicateEmail([customer(1)], "CUSTOMER1@example.com")).toBe(true);
  });

  it("100件を超える顧客を追加しない", () => {
    const customers = Array.from({ length: MAX_CUSTOMERS }, (_, index) =>
      customer(index),
    );
    const result = addCustomer(customers, {
      name: "上限超過",
      email: "over@example.com",
      orderNumber: "",
    });
    expect(result.ok).toBe(false);
  });
});

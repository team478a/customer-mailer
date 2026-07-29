import { Customer } from "../../customers/domain/customer";
import { Delivery } from "../domain/delivery";

export function simulateDeliveries(
  customers: Customer[],
  subject: string,
  now = new Date(),
): Delivery[] {
  return customers.map((customer) => ({
    id: crypto.randomUUID(),
    customerName: customer.name,
    email: customer.email,
    subject: subject.trim(),
    sentAt: now.toISOString(),
    status: "送信済み",
  }));
}

export function countDeliveriesInMonth(
  deliveries: Delivery[],
  target = new Date(),
) {
  return deliveries.filter((delivery) => {
    const sentAt = new Date(delivery.sentAt);
    return (
      sentAt.getFullYear() === target.getFullYear() &&
      sentAt.getMonth() === target.getMonth()
    );
  }).length;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function createDeliveryHistoryCsv(deliveries: Delivery[]) {
  const rows = [
    ["送信日時", "購入者名", "メールアドレス", "件名", "ステータス"],
    ...deliveries.map((delivery) => [
      new Date(delivery.sentAt).toLocaleString("ja-JP"),
      delivery.customerName,
      delivery.email,
      delivery.subject,
      delivery.status,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}

import { Customer } from "../../customers/domain/customer";

export function personalize(value: string, customer: Customer) {
  return value
    .replaceAll("{{customer_name}}", customer.name)
    .replaceAll("{{order_number}}", customer.orderNumber || "（注文番号なし）");
}

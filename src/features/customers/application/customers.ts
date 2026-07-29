import {
  Customer,
  CustomerInput,
  CustomerStatus,
  MAX_CUSTOMERS,
} from "../domain/customer";

export type CustomerMutationResult =
  | { ok: true; customers: Customer[]; customer: Customer }
  | { ok: false; message: string };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

export function hasDuplicateEmail(
  customers: Customer[],
  email: string,
  exceptId?: string,
) {
  const normalized = normalizeEmail(email);
  return customers.some(
    (customer) =>
      customer.id !== exceptId && normalizeEmail(customer.email) === normalized,
  );
}

export function addCustomer(
  customers: Customer[],
  input: CustomerInput,
): CustomerMutationResult {
  if (customers.length >= MAX_CUSTOMERS) {
    return { ok: false, message: "登録上限の100件に達しています。" };
  }
  if (!input.name.trim() || !isValidEmail(input.email)) {
    return { ok: false, message: "購入者名と正しいメールアドレスが必要です。" };
  }
  if (hasDuplicateEmail(customers, input.email)) {
    return {
      ok: false,
      message: "同じメールアドレスはすでに登録されています。",
    };
  }
  const customer: Customer = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    orderNumber: input.orderNumber.trim(),
    createdAt: new Date().toISOString(),
    status: "未対応",
  };
  return { ok: true, customers: [customer, ...customers], customer };
}

export function updateCustomer(
  customers: Customer[],
  id: string,
  input: CustomerInput,
): CustomerMutationResult {
  if (hasDuplicateEmail(customers, input.email, id)) {
    return {
      ok: false,
      message: "同じメールアドレスはすでに登録されています。",
    };
  }
  const current = customers.find((customer) => customer.id === id);
  if (!current || !input.name.trim() || !isValidEmail(input.email)) {
    return { ok: false, message: "購入者情報を確認してください。" };
  }
  const customer = {
    ...current,
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    orderNumber: input.orderNumber.trim(),
  };
  return {
    ok: true,
    customers: customers.map((item) => (item.id === id ? customer : item)),
    customer,
  };
}

export function removeCustomer(customers: Customer[], id: string) {
  return customers.filter((customer) => customer.id !== id);
}

export function changeCustomerStatus(
  customers: Customer[],
  id: string,
  status: CustomerStatus,
) {
  return customers.map((customer) =>
    customer.id === id ? { ...customer, status } : customer,
  );
}

export function searchCustomers(customers: Customer[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return customers;
  return customers.filter((customer) =>
    [
      customer.name,
      customer.email,
      customer.orderNumber,
      customer.status ?? "未対応",
    ].some((value) => value.toLowerCase().includes(normalized)),
  );
}

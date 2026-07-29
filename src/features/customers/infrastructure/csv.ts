import { isValidEmail, normalizeEmail } from "../application/customers";
import { Customer, MAX_CUSTOMERS } from "../domain/customer";

export type CsvImportError = { line: number; message: string };
export type CsvImportResult = {
  customers: Customer[];
  errors: CsvImportError[];
};

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

export function importCustomersFromCsv(
  text: string,
  existingCustomers: Customer[],
): CsvImportResult {
  const rows = parseCsv(text);
  const errors: CsvImportError[] = [];
  if (rows.length === 0) {
    return { customers: [], errors: [{ line: 1, message: "CSVが空です。" }] };
  }

  const headers = rows[0].map((header) => header.toLowerCase());
  const find = (names: string[]) =>
    headers.findIndex((header) => names.includes(header));
  const nameIndex = find(["name", "customer_name", "購入者名", "氏名", "名前"]);
  const emailIndex = find(["email", "メール", "メールアドレス"]);
  const orderIndex = find(["order_number", "order", "注文番号"]);
  if (nameIndex < 0 || emailIndex < 0) {
    return {
      customers: [],
      errors: [
        {
          line: 1,
          message: "「購入者名」と「メールアドレス」の列が必要です。",
        },
      ],
    };
  }

  const knownEmails = new Set(
    existingCustomers.map((customer) => normalizeEmail(customer.email)),
  );
  const available = MAX_CUSTOMERS - existingCustomers.length;
  const customers: Customer[] = [];

  rows.slice(1).forEach((values, rowIndex) => {
    const line = rowIndex + 2;
    const name = values[nameIndex]?.trim() ?? "";
    const email = normalizeEmail(values[emailIndex] ?? "");
    if (!name) {
      errors.push({ line, message: "購入者名が空です。" });
      return;
    }
    if (!isValidEmail(email)) {
      errors.push({ line, message: "メールアドレスの形式が不正です。" });
      return;
    }
    if (knownEmails.has(email)) {
      errors.push({ line, message: "メールアドレスが重複しています。" });
      return;
    }
    if (customers.length >= available) {
      errors.push({ line, message: "登録上限100件を超えています。" });
      return;
    }
    knownEmails.add(email);
    customers.push({
      id: crypto.randomUUID(),
      name,
      email,
      orderNumber: orderIndex >= 0 ? (values[orderIndex]?.trim() ?? "") : "",
      createdAt: new Date().toISOString(),
      status: "未対応",
    });
  });
  return { customers, errors };
}

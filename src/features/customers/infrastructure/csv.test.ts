import { describe, expect, it } from "vitest";
import { importCustomersFromCsv, parseCsv } from "./csv";

describe("CSV import", () => {
  it("BOM、引用符、カンマを含む値、空行を解析する", () => {
    const rows = parseCsv(
      '\uFEFF購入者名,メールアドレス,注文番号\r\n"山田, 太郎",taro@example.com,"ORD-""1"""\r\n\r\n',
    );
    expect(rows).toEqual([
      ["購入者名", "メールアドレス", "注文番号"],
      ["山田, 太郎", "taro@example.com", 'ORD-"1"'],
    ]);
  });

  it("CSV内重複と不正メールを行番号付きで除外する", () => {
    const result = importCustomersFromCsv(
      "購入者名,メールアドレス\n山田,taro@example.com\n重複,TARO@example.com\n不正,invalid",
      [],
    );
    expect(result.customers).toHaveLength(1);
    expect(result.errors).toEqual([
      { line: 3, message: "メールアドレスが重複しています。" },
      { line: 4, message: "メールアドレスの形式が不正です。" },
    ]);
  });
});

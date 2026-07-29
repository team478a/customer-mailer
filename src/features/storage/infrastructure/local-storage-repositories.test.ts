import { describe, expect, it } from "vitest";
import { Customer } from "../../customers/domain/customer";
import {
  createLocalStorageRepositories,
  StorageLike,
} from "./local-storage-repositories";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("local storage repositories", () => {
  it("顧客データをプロジェクト別に分離する", () => {
    const repositories = createLocalStorageRepositories(new MemoryStorage());
    const customer: Customer = {
      id: "1",
      name: "山田",
      email: "taro@example.com",
      orderNumber: "",
      createdAt: "2026-01-01T00:00:00.000Z",
      status: "未対応",
    };
    repositories.customers.saveByProject("project-a", [customer]);
    repositories.customers.saveByProject("project-b", []);

    expect(repositories.customers.findByProject("project-a")).toEqual([
      customer,
    ]);
    expect(repositories.customers.findByProject("project-b")).toEqual([]);
  });
});

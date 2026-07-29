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
  removeItem(key: string) {
    this.values.delete(key);
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

  it("配信バッチをプロジェクト別に永続化する", () => {
    const repositories = createLocalStorageRepositories(new MemoryStorage());
    const batch = {
      id: "batch-1",
      subject: "件名",
      body: "本文",
      createdAt: "2026-07-20T00:00:00.000Z",
      completedAt: "2026-07-20T00:00:00.000Z",
      status: "送信済み" as const,
      recipients: [],
    };
    repositories.deliveryBatches.saveByProject("project-a", [batch]);

    expect(repositories.deliveryBatches.findByProject("project-a")).toEqual([
      batch,
    ]);
    expect(repositories.deliveryBatches.findByProject("project-b")).toEqual([]);
  });

  it("通常設定と秘密情報を別のストレージへ保存する", () => {
    const persistent = new MemoryStorage();
    const session = new MemoryStorage();
    const repositories = createLocalStorageRepositories(persistent, session);
    const settings = repositories.settings.findByProject("project-a");
    repositories.settings.saveByProject("project-a", {
      ...settings,
      fromName: "テストショップ",
    });
    repositories.secretSettings.saveByProject("project-a", {
      resendApiKey: "re_test_secret",
      resendWebhookSecret: "whsec_test",
    });

    const reloaded = createLocalStorageRepositories(persistent, session);
    expect(reloaded.settings.findByProject("project-a").fromName).toBe(
      "テストショップ",
    );
    expect(
      reloaded.secretSettings.findByProject("project-a").resendApiKey,
    ).toBe("re_test_secret");
    expect(
      createLocalStorageRepositories(persistent, new MemoryStorage())
        .secretSettings.findByProject("project-a")
        .resendApiKey,
    ).toBe("");
  });

  it("指定プロジェクトのデータと秘密情報だけを削除する", () => {
    const persistent = new MemoryStorage();
    const session = new MemoryStorage();
    const repositories = createLocalStorageRepositories(persistent, session);
    repositories.customers.saveByProject("project-a", [
      {
        id: "1",
        name: "削除対象",
        email: "delete@example.com",
        orderNumber: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "未対応",
      },
    ]);
    repositories.secretSettings.saveByProject("project-a", {
      resendApiKey: "re_delete",
      resendWebhookSecret: "",
    });
    repositories.customers.saveByProject("project-b", []);

    repositories.projectData.clearProject("project-a");

    expect(repositories.customers.findByProject("project-a")).toEqual([]);
    expect(
      repositories.secretSettings.findByProject("project-a").resendApiKey,
    ).toBe("");
    expect(repositories.customers.findByProject("project-b")).toEqual([]);
  });
});

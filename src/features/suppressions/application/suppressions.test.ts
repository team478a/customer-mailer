import { describe, expect, it } from "vitest";
import { addSuppression, isSuppressed } from "./suppressions";

describe("suppressions", () => {
  it("大文字小文字を無視して配信停止対象を判定する", () => {
    const result = addSuppression([], "Stop@Example.com", "配信停止希望");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isSuppressed(result.entries, "STOP@example.com")).toBe(true);
    }
  });

  it("同じアドレスの重複登録を拒否する", () => {
    const first = addSuppression([], "stop@example.com", "手動除外");
    if (!first.ok) throw new Error("setup failed");
    expect(
      addSuppression(first.entries, "STOP@example.com", "バウンス").ok,
    ).toBe(false);
  });
});

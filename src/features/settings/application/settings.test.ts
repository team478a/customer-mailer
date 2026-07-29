import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_SETTINGS,
  EMPTY_PROJECT_SECRETS,
} from "../domain/project-settings";
import {
  applyMailSettings,
  maskSecret,
  validateProjectSettings,
} from "./settings";

describe("settings", () => {
  it("Resend設定の必須項目を検証する", () => {
    const result = validateProjectSettings(
      { ...DEFAULT_PROJECT_SETTINGS, mailProvider: "resend" },
      EMPTY_PROJECT_SECRETS,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContain(
        "Resend APIキーはre_で始まる値を設定してください。",
      );
    }
  });

  it("秘密情報を前後だけ残してマスクする", () => {
    expect(maskSecret("re_1234567890abcd")).toBe("re_1••••abcd");
  });

  it("件名接頭辞・署名・フッターをメールへ適用する", () => {
    expect(
      applyMailSettings("発送しました", "本文", {
        ...DEFAULT_PROJECT_SETTINGS,
        subjectPrefix: "[ショップ]",
        signature: "担当：山田",
        footer: "東京都",
      }),
    ).toEqual({
      subject: "[ショップ] 発送しました",
      body:
        "本文\n\n担当：山田\n\n東京都\n\n配信停止をご希望の場合は、このメールへご返信ください。",
    });
  });
});

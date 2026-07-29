import { describe, expect, it } from "vitest";
import {
  createProjectBackup,
  parseProjectBackup,
} from "./project-backup";
import { DEFAULT_PROJECT_SETTINGS } from "../../settings/domain/project-settings";

describe("project backup", () => {
  it("バージョン付きバックアップを作成して復元する", () => {
    const backup = createProjectBackup(
      {
        project: {
          id: "project-1",
          name: "テスト",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        customers: [],
        templates: [],
        draft: { subject: "", body: "" },
        deliveries: [],
        deliveryBatches: [],
        settings: DEFAULT_PROJECT_SETTINGS,
      },
      new Date("2026-07-29T00:00:00.000Z"),
    );
    const result = parseProjectBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.backup.project.name).toBe("テスト");
  });

  it("未知のバージョンを拒否する", () => {
    expect(parseProjectBackup('{"version":99}')).toEqual({
      ok: false,
      message: "対応していないバックアップ形式です。",
    });
  });
});

export function DataSyncPanel({
  customerCount,
  dataMode,
  isBusy,
  onMigrate,
  saveStatus,
  serverAvailable,
}: {
  customerCount: number;
  dataMode: "local" | "supabase";
  isBusy: boolean;
  onMigrate: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
  serverAvailable: boolean;
}) {
  const statusLabel =
    saveStatus === "saving"
      ? "保存中…"
      : saveStatus === "saved"
        ? "保存済み"
        : saveStatus === "error"
          ? "保存エラー"
          : "";
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-indigo-600">DATA STORAGE</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                dataMode === "supabase"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {dataMode === "supabase" ? "Supabase" : "LocalStorage"}
            </span>
            {statusLabel && (
              <span
                className={`text-xs font-semibold ${
                  saveStatus === "error" ? "text-red-600" : "text-slate-400"
                }`}
              >
                {statusLabel}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold">データ保存・移行</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {dataMode === "supabase"
              ? "変更内容はプロジェクト単位でSupabaseへ自動保存され、別の端末からも参照できます。"
              : `現在のプロジェクトには顧客${customerCount}件があります。移行前にJSONバックアップを自動作成します。`}
          </p>
        </div>
        {dataMode === "local" && (
          <button
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!serverAvailable || isBusy}
            onClick={onMigrate}
            type="button"
          >
            {isBusy
              ? "移行中…"
              : serverAvailable
                ? "Supabaseへ移行"
                : "Supabase未接続"}
          </button>
        )}
      </div>
      {dataMode === "local" && serverAvailable && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          移行後も元のLocalStorageデータは削除しません。切り戻し用としてブラウザ内に保持されます。
        </p>
      )}
    </section>
  );
}

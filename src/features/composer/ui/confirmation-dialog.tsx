export function ConfirmationDialog({
  count,
  isSending,
  onCancel,
  onConfirm,
  subject,
  errors,
  warnings,
  excludedCount,
  previews,
  isLive,
}: {
  count: number;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  subject: string;
  errors: string[];
  warnings: string[];
  excludedCount: number;
  previews: { name: string; email: string; subject: string }[];
  isLive: boolean;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-bold text-indigo-600">FINAL CHECK</p>
        <h2 className="mt-1 text-xl font-bold">
          個別送信を記録しますか？
        </h2>
        <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <dt className="text-slate-500">宛先</dt>
          <dd className="font-bold">{count}件</dd>
          <dt className="text-slate-500">件名</dt>
          <dd className="font-bold">{subject}</dd>
          <dt className="text-slate-500">方式</dt>
          <dd className="font-bold">宛先ごとの個別送信</dd>
        </dl>
        {!!errors.length && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            {errors.map((error) => <p key={error}>・{error}</p>)}
          </div>
        )}
        {!!warnings.length && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {warnings.map((warning) => <p key={warning}>・{warning}</p>)}
          </div>
        )}
        {excludedCount > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            配信停止リストにより{excludedCount}件を送信対象から除外します。
          </p>
        )}
        {!!previews.length && (
          <div className="mt-4 max-h-40 overflow-auto rounded-xl border border-slate-200">
            {previews.slice(0, 10).map((preview) => (
              <div className="border-b border-slate-100 px-4 py-3 text-xs last:border-0" key={preview.email}>
                <p className="font-bold">{preview.name} &lt;{preview.email}&gt;</p>
                <p className="mt-1 truncate text-slate-500">{preview.subject}</p>
              </div>
            ))}
            {previews.length > 10 && (
              <p className="px-4 py-3 text-xs text-slate-500">ほか{previews.length - 10}件</p>
            )}
          </div>
        )}
        <p className={`mt-4 text-xs ${isLive ? "font-bold text-red-700" : "text-amber-800"}`}>
          {isLive
            ? "本番送信です。確認後、実際のメールが各宛先へ送信されます。"
            : "ローカルシミュレーションのため、実際のメールは送信されません。"}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            disabled={isSending || errors.length > 0}
            onClick={onCancel}
            type="button"
          >
            戻る
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
            disabled={isSending}
            onClick={onConfirm}
            type="button"
          >
            {isSending
              ? "処理中…"
              : isLive
                ? `${count}件へ送信`
                : `${count}件を記録`}
          </button>
        </div>
      </div>
    </div>
  );
}

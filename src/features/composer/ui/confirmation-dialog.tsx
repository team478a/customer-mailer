export function ConfirmationDialog({
  count,
  isSending,
  onCancel,
  onConfirm,
  subject,
}: {
  count: number;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  subject: string;
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
        <p className="mt-4 text-xs text-amber-800">
          ローカルシミュレーションのため、実際のメールは送信されません。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            disabled={isSending}
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
            {isSending ? "処理中…" : `${count}件を記録`}
          </button>
        </div>
      </div>
    </div>
  );
}

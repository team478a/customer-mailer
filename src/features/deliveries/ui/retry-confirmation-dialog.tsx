import { Delivery } from "../domain/delivery";

export function RetryConfirmationDialog({
  deliveries,
  isRetrying,
  onCancel,
  onConfirm,
}: {
  deliveries: Delivery[];
  isRetrying: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-labelledby="retry-confirmation-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-bold text-red-600">RETRY CHECK</p>
        <h2 className="mt-1 text-xl font-bold" id="retry-confirmation-title">
          失敗した{deliveries.length}件を再送しますか？
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          以下の宛先だけを再送します。送信済みの宛先は含まれません。
        </p>
        <div className="mt-5 max-h-64 overflow-auto rounded-xl border border-slate-200">
          {deliveries.map((delivery) => (
            <div
              className="border-b border-slate-100 p-4 last:border-b-0"
              key={delivery.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold">{delivery.customerName}</p>
                  <p className="text-xs text-slate-500">{delivery.email}</p>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  前回失敗
                </span>
              </div>
              <p className="mt-2 text-xs text-red-600">
                {delivery.errorMessage ?? "エラー詳細なし"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50"
            disabled={isRetrying}
            onClick={onCancel}
            type="button"
          >
            戻る
          </button>
          <button
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:bg-slate-300"
            disabled={isRetrying || deliveries.length === 0}
            onClick={onConfirm}
            type="button"
          >
            {isRetrying ? "再送中…" : `${deliveries.length}件を再送`}
          </button>
        </div>
      </div>
    </div>
  );
}

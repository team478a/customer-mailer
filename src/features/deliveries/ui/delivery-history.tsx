import { Delivery, DeliveryBatch } from "../domain/delivery";

const failureStatuses = new Set([
  "失敗",
  "配信停止",
  "バウンス",
  "迷惑メール報告",
]);

function statusClass(status: Delivery["status"]) {
  if (status === "配達済み") return "bg-emerald-50 text-emerald-700";
  if (status === "送信済み") return "bg-blue-50 text-blue-700";
  if (status === "遅延") return "bg-amber-50 text-amber-700";
  if (failureStatuses.has(status)) return "bg-red-50 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export function DeliveryHistory({
  batches,
  deliveries,
  isRetrying,
  isRefreshing,
  onExport,
  onRefresh,
  onRetry,
  onToggleAllFailures,
  onToggleFailure,
  selectedFailureIds,
}: {
  batches: DeliveryBatch[];
  deliveries: Delivery[];
  isRetrying: boolean;
  isRefreshing: boolean;
  onExport: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onToggleAllFailures: () => void;
  onToggleFailure: (id: string) => void;
  selectedFailureIds: string[];
}) {
  const failedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "失敗",
  );
  const allFailuresSelected =
    failedDeliveries.length > 0 &&
    failedDeliveries.every((delivery) =>
      selectedFailureIds.includes(delivery.id),
    );

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">配信履歴</h2>
          <p className="mt-1 text-sm text-slate-500">
            このプロジェクトの配信{batches.length}回・宛先
            {deliveries.length}件の履歴です。
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
            disabled={isRefreshing}
            onClick={onRefresh}
            type="button"
          >
            {isRefreshing ? "更新中…" : "最新状態に更新"}
          </button>
          {failedDeliveries.length > 0 && (
            <button
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!selectedFailureIds.length || isRetrying}
              onClick={onRetry}
              type="button"
            >
              {isRetrying
                ? "再送中…"
                : `選択した${selectedFailureIds.length}件を再送`}
            </button>
          )}
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
            disabled={!deliveries.length}
            onClick={onExport}
            type="button"
          >
            CSV出力
          </button>
        </div>
      </div>
      {!deliveries.length ? (
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          配信履歴はまだありません。
        </div>
      ) : (
        <>
        {!!batches.length && (
          <div className="divide-y divide-slate-100 border-b border-slate-100">
            {batches.map((batch) => (
              <details className="px-5 py-4 sm:px-6" key={batch.id}>
                <summary className="cursor-pointer text-sm font-bold">
                  {new Intl.DateTimeFormat("ja-JP", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(batch.createdAt))}
                  {" ・ "}{batch.subject || "（件名なし）"}{" ・ "}
                  {batch.recipients.length}件（{batch.status}）
                </summary>
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="whitespace-pre-wrap text-slate-600">{batch.body}</p>
                  <ul className="mt-4 space-y-2">
                    {batch.recipients.map((recipient) => (
                      <li className="flex justify-between gap-4" key={recipient.id}>
                        <span>{recipient.customerName} &lt;{recipient.email}&gt;</span>
                        <span className={failureStatuses.has(recipient.status) ? "text-red-600" : "text-emerald-700"}>
                          {recipient.status}
                          {recipient.errorMessage ? `: ${recipient.errorMessage}` : ""}
                          {recipient.deliveredAt
                            ? `（${new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(new Date(recipient.deliveredAt))}）`
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-12 px-6 py-3">
                  {failedDeliveries.length > 0 && (
                    <input
                      aria-label="失敗した宛先をすべて選択"
                      checked={allFailuresSelected}
                      className="h-4 w-4 accent-red-600"
                      onChange={onToggleAllFailures}
                      type="checkbox"
                    />
                  )}
                </th>
                {["送信日時", "購入者", "件名", "ステータス"].map((label) => (
                  <th className="px-6 py-3 font-semibold" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-6 py-4">
                    {delivery.status === "失敗" && (
                      <input
                        aria-label={`${delivery.email}を再送対象に選択`}
                        checked={selectedFailureIds.includes(delivery.id)}
                        className="h-4 w-4 accent-red-600"
                        onChange={() => onToggleFailure(delivery.id)}
                        type="checkbox"
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                    {new Intl.DateTimeFormat("ja-JP", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(delivery.sentAt))}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold">{delivery.customerName}</p>
                    <p className="text-xs text-slate-500">{delivery.email}</p>
                  </td>
                  <td className="max-w-xs truncate px-6 py-4">
                    {delivery.subject}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(delivery.status)}`}
                      title={delivery.errorMessage}
                    >
                      {delivery.status}
                    </span>
                    {delivery.errorMessage && (
                      <p className="mt-2 max-w-xs text-xs text-red-600">
                        {delivery.errorMessage}
                      </p>
                    )}
                    {delivery.deliveredAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        配達 {new Intl.DateTimeFormat("ja-JP", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(delivery.deliveredAt))}
                      </p>
                    )}
                    {!!delivery.retryCount && (
                      <p className="mt-1 text-xs text-slate-400">
                        再送 {delivery.retryCount}回
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}

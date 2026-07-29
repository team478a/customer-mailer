import { Delivery } from "../domain/delivery";

export function DeliveryHistory({
  deliveries,
  onExport,
}: {
  deliveries: Delivery[];
  onExport: () => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">配信履歴</h2>
          <p className="mt-1 text-sm text-slate-500">
            このプロジェクトで記録した個別送信の履歴です。
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40"
          disabled={!deliveries.length}
          onClick={onExport}
          type="button"
        >
          CSV出力
        </button>
      </div>
      {!deliveries.length ? (
        <div className="px-6 py-16 text-center text-sm text-slate-500">
          配信履歴はまだありません。
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
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
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {delivery.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

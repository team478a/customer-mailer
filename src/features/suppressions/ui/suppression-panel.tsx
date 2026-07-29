import { FormEvent } from "react";
import {
  SuppressionEntry,
  SuppressionReason,
} from "../domain/suppression";

export function SuppressionPanel({
  entries,
  onAdd,
  onRemove,
}: {
  entries: SuppressionEntry[];
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <p className="text-sm font-bold text-indigo-600">SUPPRESSION LIST</p>
        <h2 className="mt-1 text-xl font-bold">配信停止・送信除外リスト</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          登録されたアドレスは送信前検査で自動的に除外されます。
        </p>
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem_auto]" onSubmit={onAdd}>
          <input
            aria-label="除外するメールアドレス"
            className="field"
            name="email"
            placeholder="customer@example.com"
            required
            type="email"
          />
          <select className="field" defaultValue="手動除外" name="reason">
            {(
              [
                "配信停止希望",
                "バウンス",
                "迷惑メール報告",
                "手動除外",
              ] satisfies SuppressionReason[]
            ).map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </select>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            type="submit"
          >
            追加
          </button>
        </form>
      </div>
      {!entries.length ? (
        <div className="px-6 py-14 text-center text-sm text-slate-500">
          配信停止・除外アドレスはありません。
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <div className="flex items-center gap-4 px-5 py-4 sm:px-6" key={entry.id}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{entry.email}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.reason}・
                  {new Intl.DateTimeFormat("ja-JP").format(
                    new Date(entry.createdAt),
                  )}
                </p>
              </div>
              <button
                className="rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                onClick={() => onRemove(entry.id)}
                type="button"
              >
                解除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import Link from "next/link";

const summaryCards = [
  { label: "登録済み宛先", value: "0", note: "連絡先を追加して開始" },
  { label: "今月の配信数", value: "0", note: "配信履歴はありません" },
  { label: "下書き", value: "0", note: "作成中のメールはありません" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-bold tracking-[0.16em] text-blue-600">
              MAILFLOW
            </p>
            <p className="mt-1 text-xs text-slate-400">メール配信管理</p>
          </div>
          <Link
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            href="/"
          >
            ログアウト
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              ダッシュボード
            </h1>
            <p className="mt-2 text-slate-500">
              メール配信の状況をここで確認できます。
            </p>
          </div>
          <button
            className="cursor-not-allowed rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-500"
            disabled
            type="button"
          >
            新規メールを作成（準備中）
          </button>
        </div>

        <section
          aria-label="配信サマリー"
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {summaryCards.map((card) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={card.label}
            >
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-3 text-4xl font-bold text-slate-900">
                {card.value}
              </p>
              <p className="mt-4 text-sm text-slate-400">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600">
            ✉
          </div>
          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            まだ配信履歴がありません
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            SupabaseとResendの接続後、作成したキャンペーンと配信結果がここに表示されます。
          </p>
        </section>
      </div>
    </main>
  );
}

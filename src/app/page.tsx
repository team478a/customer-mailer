import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-blue-600">
            MAILSEND
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            おかえりなさい
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            購入者メール管理へログインします。
          </p>
        </div>

        <form className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            メールアドレス
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="email"
              placeholder="name@example.com"
              type="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            パスワード
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="password"
              placeholder="8文字以上"
              type="password"
            />
          </label>
          <Link
            className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            href="/dashboard"
          >
            ログイン
          </Link>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          ローカルMVPのため、入力内容にかかわらずログインできます。
        </p>
      </section>
    </main>
  );
}

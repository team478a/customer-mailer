import { signIn } from "@/features/auth/application/actions";
import { isSupabaseConfigured } from "@/lib/server/environment";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = isSupabaseConfigured();
  const { error } = await searchParams;
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

        <form action={signIn} className="space-y-5">
          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <label className="block text-sm font-medium text-slate-700">
            メールアドレス
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="email"
              placeholder="name@example.com"
              required={configured}
              type="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            パスワード
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              name="password"
              placeholder="8文字以上"
              required={configured}
              type="password"
            />
          </label>
          <button
            className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            type="submit"
          >
            {configured ? "ログイン" : "ローカルモードで開始"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          {configured
            ? "Supabase Authで認証します。"
            : "外部サービス未設定のためローカルモードで起動します。"}
        </p>
      </section>
    </main>
  );
}

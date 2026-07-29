import Link from "next/link";
import { ReactNode } from "react";

export function DashboardHeader({ children }: { children: ReactNode }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
            M
          </div>
          <div>
            <p className="font-bold tracking-tight">MailSend</p>
            <p className="text-xs text-slate-500">購入者メール管理</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {children}
          <Link
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            href="/"
          >
            ログアウト
          </Link>
        </div>
      </div>
    </header>
  );
}

import { FormEvent } from "react";

export function CustomerForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-5 grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
      <input
        aria-label="購入者名"
        className="field"
        name="name"
        placeholder="購入者名"
        required
      />
      <input
        aria-label="メールアドレス"
        className="field"
        name="email"
        placeholder="メールアドレス"
        required
        type="email"
      />
      <div className="flex gap-2">
        <input
          aria-label="注文番号"
          className="field min-w-0"
          name="orderNumber"
          placeholder="注文番号（任意）"
        />
        <button
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={disabled}
          type="submit"
        >
          追加
        </button>
      </div>
    </form>
  );
}

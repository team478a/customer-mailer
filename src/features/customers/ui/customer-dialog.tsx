import { FormEvent } from "react";
import { Customer } from "../domain/customer";

export function CustomerDialog({
  customer,
  onCancel,
  onSubmit,
}: {
  customer: Customer;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={onSubmit}
      >
        <h2 className="text-xl font-bold">購入者情報を編集</h2>
        <div className="mt-5 space-y-4">
          {[
            ["購入者名", "name", customer.name, "text"],
            ["メールアドレス", "email", customer.email, "email"],
            ["注文番号", "orderNumber", customer.orderNumber, "text"],
          ].map(([label, name, value, type]) => (
            <label className="block text-sm font-semibold" key={name}>
              {label}
              <input
                className="field mt-2"
                defaultValue={value}
                name={name}
                required={name !== "orderNumber"}
                type={type}
              />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            onClick={onCancel}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
            type="submit"
          >
            更新
          </button>
        </div>
      </form>
    </div>
  );
}

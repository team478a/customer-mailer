import { Customer, CustomerStatus } from "../domain/customer";

export function CustomerList({
  customers,
  onEdit,
  onRemove,
  onStatusChange,
  onToggle,
  selectedIds,
}: {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onRemove: (id: string) => void;
  onStatusChange: (id: string, status: CustomerStatus) => void;
  onToggle: (id: string) => void;
  selectedIds: string[];
}) {
  if (!customers.length) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl">
          ✉
        </div>
        <h3 className="mt-4 font-bold">購入者が見つかりません</h3>
        <p className="mt-2 text-sm text-slate-500">
          フォームまたはCSVから購入者を登録してください。
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-100">
      {customers.map((customer) => (
        <div
          className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50 sm:px-6"
          key={customer.id}
        >
          <input
            aria-label={`${customer.name}を選択`}
            checked={selectedIds.includes(customer.id)}
            className="h-4 w-4 accent-indigo-600"
            onChange={() => onToggle(customer.id)}
            type="checkbox"
          />
          <div className="min-w-48 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{customer.name}</p>
              {customer.orderNumber && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                  {customer.orderNumber}
                </span>
              )}
            </div>
            <p className="truncate text-sm text-slate-500">{customer.email}</p>
          </div>
          <select
            aria-label={`${customer.name}の対応状況`}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
            onChange={(event) =>
              onStatusChange(customer.id, event.target.value as CustomerStatus)
            }
            value={customer.status ?? "未対応"}
          >
            <option>未対応</option>
            <option>対応中</option>
            <option>完了</option>
          </select>
          <button
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => onEdit(customer)}
            type="button"
          >
            編集
          </button>
          <button
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => onRemove(customer.id)}
            type="button"
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}

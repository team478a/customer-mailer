import { Customer } from "../domain/customer";

export function RecipientSelector({
  customers,
  onToggleAll,
  selectedIds,
}: {
  customers: Customer[];
  onToggleAll: () => void;
  selectedIds: string[];
}) {
  const allSelected =
    customers.length > 0 &&
    customers.every((customer) => selectedIds.includes(customer.id));
  return (
    <div className="flex items-center justify-between bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-6">
      <button className="hover:text-indigo-600" onClick={onToggleAll} type="button">
        {allSelected ? "すべて解除" : "すべて選択"}
      </button>
      <span>{selectedIds.length}件を選択中</span>
    </div>
  );
}

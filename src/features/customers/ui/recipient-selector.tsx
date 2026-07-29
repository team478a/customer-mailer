import { Customer } from "../domain/customer";
import { CustomerStatus } from "../domain/customer";

export function RecipientSelector({
  customers,
  onToggleAll,
  selectedIds,
  onBulkStatus,
  onBulkDelete,
}: {
  customers: Customer[];
  onToggleAll: () => void;
  selectedIds: string[];
  onBulkStatus: (status: CustomerStatus) => void;
  onBulkDelete: () => void;
}) {
  const allSelected =
    customers.length > 0 &&
    customers.every((customer) => selectedIds.includes(customer.id));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-6">
      <button className="hover:text-indigo-600" onClick={onToggleAll} type="button">
        {allSelected ? "すべて解除" : "すべて選択"}
      </button>
      <div className="flex items-center gap-2">
        <span>{selectedIds.length}件を選択中</span>
        {selectedIds.length > 0 && (
          <>
            <select
              aria-label="選択した購入者のステータスを変更"
              className="rounded-lg border border-slate-300 bg-white px-2 py-1"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  onBulkStatus(event.target.value as CustomerStatus);
                  event.target.value = "";
                }
              }}
            >
              <option disabled value="">一括変更</option>
              {(["未対応", "対応中", "完了"] satisfies CustomerStatus[]).map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            <button className="text-red-600" onClick={onBulkDelete} type="button">
              一括削除
            </button>
          </>
        )}
      </div>
    </div>
  );
}

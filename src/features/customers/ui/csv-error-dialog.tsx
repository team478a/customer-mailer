import { CsvImportError } from "../infrastructure/csv";

export function CsvErrorDialog({
  errors,
  onClose,
  onExport,
}: {
  errors: CsvImportError[];
  onClose: () => void;
  onExport: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-bold text-amber-600">CSV IMPORT RESULT</p>
        <h2 className="mt-1 text-xl font-bold">{errors.length}件を除外しました</h2>
        <div className="mt-5 max-h-72 overflow-auto rounded-xl border border-slate-200">
          {errors.map((error, index) => (
            <div
              className="flex gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
              key={`${error.line}-${index}`}
            >
              <span className="shrink-0 font-bold text-slate-500">
                {error.line}行目
              </span>
              <span className="text-slate-700">{error.message}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            onClick={onExport}
            type="button"
          >
            エラーCSVを出力
          </button>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
            onClick={onClose}
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

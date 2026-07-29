import { ChangeEvent } from "react";

export function CsvImportPanel({
  onImport,
  onSearch,
  searchQuery,
}: {
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}) {
  return (
    <>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="購入者を検索"
          className="field"
          onChange={(event) => onSearch(event.target.value)}
          placeholder="名前・メール・注文番号で検索"
          type="search"
          value={searchQuery}
        />
        <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          CSV取り込み
          <input
            accept=".csv,text/csv"
            className="sr-only"
            onChange={onImport}
            type="file"
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        CSV列名：購入者名、メールアドレス、注文番号（任意）
      </p>
    </>
  );
}

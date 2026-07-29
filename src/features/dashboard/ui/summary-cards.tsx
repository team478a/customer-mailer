export function SummaryCards({
  customerCount,
  monthlyDeliveryCount,
  recipientCount,
}: {
  customerCount: number;
  monthlyDeliveryCount: number;
  recipientCount: number;
}) {
  const cards = [
    { label: "登録済み購入者", value: customerCount, note: "上限 100件" },
    { label: "今回の送信対象", value: recipientCount, note: "選択中の宛先" },
    {
      label: "今月の送信記録",
      value: monthlyDeliveryCount,
      note: "ローカル記録",
    },
  ];
  return (
    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          key={card.label}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
            </div>
            <p className="text-xs text-slate-400">{card.note}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

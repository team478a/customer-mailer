export type SuppressionReason =
  | "配信停止希望"
  | "バウンス"
  | "迷惑メール報告"
  | "手動除外";

export type SuppressionEntry = {
  id: string;
  email: string;
  reason: SuppressionReason;
  createdAt: string;
};

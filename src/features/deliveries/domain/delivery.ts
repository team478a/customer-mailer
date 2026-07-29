export type RecipientDeliveryStatus = "送信済み" | "失敗";
export type DeliveryBatchStatus =
  | "送信待ち"
  | "送信中"
  | "送信済み"
  | "一部失敗"
  | "失敗";

export type Delivery = {
  id: string;
  batchId?: string;
  customerId?: string;
  customerName: string;
  email: string;
  subject: string;
  body?: string;
  sentAt: string;
  status: RecipientDeliveryStatus;
  errorMessage?: string;
  retryCount?: number;
  lastRetriedAt?: string;
};

export type DeliveryRecipient = {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  status: RecipientDeliveryStatus;
  providerMessageId?: string;
  errorMessage?: string;
};

export type DeliveryBatch = {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
  completedAt?: string;
  status: DeliveryBatchStatus;
  recipients: DeliveryRecipient[];
};

import { Customer } from "../../customers/domain/customer";
import { personalize } from "../../composer/application/composer";
import {
  Delivery,
  DeliveryBatch,
  DeliveryBatchStatus,
  DeliveryRecipient,
} from "../domain/delivery";
import { MailDeliveryService } from "./mail-delivery-service";

function resolveBatchStatus(
  recipients: DeliveryRecipient[],
): DeliveryBatchStatus {
  const sent = recipients.filter((recipient) => recipient.status === "送信済み");
  if (sent.length === recipients.length) return "送信済み";
  if (sent.length === 0) return "失敗";
  return "一部失敗";
}

export async function executeDelivery(
  service: MailDeliveryService,
  customers: Customer[],
  subject: string,
  body: string,
  now = new Date(),
  sender?: {
    fromName: string;
    fromEmail: string;
    replyTo: string;
  },
): Promise<{ batch: DeliveryBatch; deliveries: Delivery[] }> {
  const batchId = crypto.randomUUID();
  const recipients = await Promise.all(
    customers.map(async (customer): Promise<DeliveryRecipient> => {
      const result = await service.send({
        customerId: customer.id,
        customerName: customer.name,
        to: customer.email,
        subject: personalize(subject.trim(), customer),
        body: personalize(body.trim(), customer),
        fromName: sender?.fromName,
        fromEmail: sender?.fromEmail,
        replyTo: sender?.replyTo,
      });
      return result.ok
        ? {
            id: crypto.randomUUID(),
            customerId: customer.id,
            customerName: customer.name,
            email: customer.email,
            status: "送信済み",
            providerMessageId: result.providerMessageId,
          }
        : {
            id: crypto.randomUUID(),
            customerId: customer.id,
            customerName: customer.name,
            email: customer.email,
            status: "失敗",
            errorMessage: result.errorMessage,
          };
    }),
  );
  const completedAt = now.toISOString();
  const batch: DeliveryBatch = {
    id: batchId,
    subject: subject.trim(),
    body: body.trim(),
    createdAt: completedAt,
    completedAt,
    status: resolveBatchStatus(recipients),
    recipients,
  };
  const deliveries = recipients.map(
    (recipient): Delivery => ({
      id: recipient.id,
      batchId,
      customerId: recipient.customerId,
      customerName: recipient.customerName,
      email: recipient.email,
      subject: subject.trim(),
      body: body.trim(),
      sentAt: completedAt,
      status: recipient.status,
      errorMessage: recipient.errorMessage,
    }),
  );
  return { batch, deliveries };
}

export function getRetryableRecipients(batch: DeliveryBatch) {
  return batch.recipients.filter((recipient) => recipient.status === "失敗");
}

export async function retryFailedDeliveries(
  service: MailDeliveryService,
  deliveries: Delivery[],
  targetIds: string[],
  now = new Date(),
) {
  const targets = new Set(targetIds);
  return Promise.all(
    deliveries.map(async (delivery): Promise<Delivery> => {
      if (delivery.status !== "失敗" || !targets.has(delivery.id)) {
        return delivery;
      }
      const result = await service.send({
        customerId: delivery.customerId ?? delivery.id,
        customerName: delivery.customerName,
        to: delivery.email,
        subject: delivery.subject,
        body: delivery.body ?? "",
      });
      return result.ok
        ? {
            ...delivery,
            status: "送信済み",
            errorMessage: undefined,
            sentAt: now.toISOString(),
            retryCount: (delivery.retryCount ?? 0) + 1,
            lastRetriedAt: now.toISOString(),
          }
        : {
            ...delivery,
            errorMessage: result.errorMessage,
            retryCount: (delivery.retryCount ?? 0) + 1,
            lastRetriedAt: now.toISOString(),
          };
    }),
  );
}

export function reconcileDeliveryBatches(
  batches: DeliveryBatch[],
  deliveries: Delivery[],
  now = new Date(),
) {
  return batches.map((batch) => {
    const batchDeliveries = deliveries.filter(
      (delivery) => delivery.batchId === batch.id,
    );
    if (!batchDeliveries.length) return batch;
    const recipients = batch.recipients.map((recipient) => {
      const delivery = batchDeliveries.find(
        (item) => item.id === recipient.id,
      );
      return delivery
        ? {
            ...recipient,
            status: delivery.status,
            errorMessage: delivery.errorMessage,
          }
        : recipient;
    });
    return {
      ...batch,
      recipients,
      status: resolveBatchStatus(recipients),
      completedAt: now.toISOString(),
    };
  });
}

export function simulateDeliveries(
  customers: Customer[],
  subject: string,
  now = new Date(),
): Delivery[] {
  return customers.map((customer) => ({
    id: crypto.randomUUID(),
    customerName: customer.name,
    email: customer.email,
    subject: subject.trim(),
    sentAt: now.toISOString(),
    status: "送信済み",
  }));
}

export function countDeliveriesInMonth(
  deliveries: Delivery[],
  target = new Date(),
) {
  return deliveries.filter((delivery) => {
    const sentAt = new Date(delivery.sentAt);
    return (
      sentAt.getFullYear() === target.getFullYear() &&
      sentAt.getMonth() === target.getMonth()
    );
  }).length;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function createDeliveryHistoryCsv(deliveries: Delivery[]) {
  const rows = [
    ["送信日時", "購入者名", "メールアドレス", "件名", "ステータス"],
    ...deliveries.map((delivery) => [
      new Date(delivery.sentAt).toLocaleString("ja-JP"),
      delivery.customerName,
      delivery.email,
      delivery.subject,
      delivery.status,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}

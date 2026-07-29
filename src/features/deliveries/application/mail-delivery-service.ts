export type SendMailInput = {
  customerId: string;
  customerName: string;
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type SendMailResult =
  | {
      ok: true;
      providerMessageId: string;
    }
  | {
      ok: false;
      errorMessage: string;
      retryable: boolean;
    };

export interface MailDeliveryService {
  send(input: SendMailInput): Promise<SendMailResult>;
}

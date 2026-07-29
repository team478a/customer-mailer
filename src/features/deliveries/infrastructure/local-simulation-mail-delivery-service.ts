import {
  MailDeliveryService,
  SendMailInput,
  SendMailResult,
} from "../application/mail-delivery-service";

export type SimulationFailureRule = (
  input: SendMailInput,
) => string | undefined;

export class LocalSimulationMailDeliveryService
  implements MailDeliveryService
{
  constructor(
    private readonly failureRule?: SimulationFailureRule,
  ) {}

  async send(input: SendMailInput): Promise<SendMailResult> {
    const errorMessage = this.failureRule?.(input);
    if (errorMessage) {
      return { ok: false, errorMessage, retryable: true };
    }
    return {
      ok: true,
      providerMessageId: `local-${crypto.randomUUID()}`,
    };
  }
}

import { describe, expect, it } from "vitest";
import { parseServerDeliveryRequest } from "./server-delivery-request";

const valid = {
  requestId: "request_1234",
  projectId: "11111111-1111-4111-8111-111111111111",
  subject: "件名",
  body: "本文",
  fromName: "Shop",
  fromEmail: "shop@example.com",
  replyTo: "",
  recipients: [{
    customerId: "22222222-2222-4222-8222-222222222222",
    customerName: "山田",
    email: "yamada@example.com",
    subject: "山田様",
    body: "本文",
  }],
};

describe("parseServerDeliveryRequest", () => {
  it("正しい送信要求を受け付ける", () => {
    expect(parseServerDeliveryRequest(valid).ok).toBe(true);
  });

  it("100件を超える要求を拒否する", () => {
    expect(
      parseServerDeliveryRequest({
        ...valid,
        recipients: Array.from({ length: 101 }, () => valid.recipients[0]),
      }).ok,
    ).toBe(false);
  });
});

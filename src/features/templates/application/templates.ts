import { MailTemplate } from "../domain/mail-template";

export const BUILT_IN_TEMPLATES: MailTemplate[] = [
  { id: "", name: "テンプレートを選択", subject: "", body: "" },
  {
    id: "thanks",
    name: "購入のお礼",
    subject: "ご購入ありがとうございます",
    body: "{{customer_name}}様\n\nこのたびはご購入いただき、誠にありがとうございます。\n注文番号：{{order_number}}\n\n商品到着まで今しばらくお待ちください。",
  },
  {
    id: "shipped",
    name: "発送のご連絡",
    subject: "商品を発送しました",
    body: "{{customer_name}}様\n\nご注文の商品を発送しました。\n注文番号：{{order_number}}\n\n到着まで今しばらくお待ちください。",
  },
  {
    id: "follow-up",
    name: "ご利用状況の確認",
    subject: "商品は問題なくご利用いただけていますか？",
    body: "{{customer_name}}様\n\n先日はご購入いただき、ありがとうございました。\n商品についてご不明な点がございましたら、お気軽にご返信ください。",
  },
];

export function createTemplate(
  name: string,
  subject: string,
  body: string,
): MailTemplate {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    subject: subject.trim(),
    body: body.trim(),
  };
}

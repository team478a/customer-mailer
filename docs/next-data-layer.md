# 次工程のデータ・送信層設計

この文書と `supabase/migrations/0001_initial_schema.sql` は設計案です。現在のローカルMVPからSupabaseやResendへ接続するものではありません。

## 送信サービス

アプリケーション層は `MailDeliveryService` のみを参照します。

```ts
interface MailDeliveryService {
  send(input: SendMailInput): Promise<SendMailResult>;
}
```

現在は `LocalSimulationMailDeliveryService` を使用します。次工程では同じ契約を実装する `ResendMailDeliveryService` をサーバー側に配置します。APIキーをブラウザへ渡してはいけません。

## 配信モデル

1回の操作を `DeliveryBatch`、各宛先の結果を `DeliveryRecipient` として分離します。

- バッチ状態：送信待ち、送信中、送信済み、一部失敗、失敗
- 宛先状態：送信済み、失敗
- 失敗した宛先だけを `getRetryableRecipients` で抽出
- プロバイダーのメッセージIDとエラー内容を宛先単位で保持

これにより、100件中の一部だけが失敗した場合でも、成功分を二重送信せず再送できます。

## Supabaseスキーマ

- `projects`：管理単位
- `project_members`：利用者と権限
- `customers`：プロジェクト別顧客
- `mail_templates`：テンプレート
- `drafts`：プロジェクトごとの下書き
- `deliveries`：配信バッチ
- `delivery_recipients`：宛先別本文・結果・試行回数
- `suppression_list`：配信停止・送信禁止アドレス

すべての業務データはプロジェクトを起点にRLSで分離します。実際に適用する前に、プロジェクト作成時のowner登録処理、更新日時トリガー、運用上の保持期間を確定する必要があります。

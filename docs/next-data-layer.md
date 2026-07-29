# 次工程のデータ・送信層設計

`supabase/migrations/0001_initial_schema.sql`と`0002_server_operations.sql`にスキーマを実装し、認証・Resend送信・Webhook受信のサーバーAPIを追加しました。外部設定なしではローカルMVPとして動作します。

## 送信サービス

アプリケーション層は `MailDeliveryService` のみを参照します。

```ts
interface MailDeliveryService {
  send(input: SendMailInput): Promise<SendMailResult>;
}
```

テストモードでは `LocalSimulationMailDeliveryService`、本番送信ではサーバー専用の `ResendMailDeliveryService` を使用します。APIキーは`RESEND_API_KEY`からのみ読み込み、ブラウザへ渡しません。

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
- `project_settings`：送信元・送信制御などの非秘密設定
- `deliveries`：配信バッチ
- `delivery_recipients`：宛先別本文・結果・試行回数
- `suppression_list`：配信停止・送信禁止アドレス

すべての業務データはプロジェクトを起点にRLSで分離します。プロジェクト作成時のowner登録と更新日時トリガーは`0002_server_operations.sql`で追加しています。保持期間は運用設定として別途決定します。

Resend APIキー、Webhook署名シークレット、Supabaseの`service_role`キーは`project_settings`へ保存せず、デプロイ先の暗号化されたサーバー環境変数で管理します。

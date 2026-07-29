# MailSend

購入者へ最大100件程度のメールを個別送信するための、シンプルな管理システムです。

外部設定なしではローカルMVPとして動作します。SupabaseとResendのサーバー環境変数を設定すると、Supabase Authによる認証とサーバーAPI経由の実メール送信を利用できます。

## 現在できること

- ローカルの仮ログイン
- プロジェクトの作成・切り替え
- 購入者、テンプレート、下書き、配信履歴のプロジェクト別管理
- 購入者の登録・削除（最大100件）
- CSVからの購入者取り込み
- 名前、メールアドレス、注文番号による検索
- 購入者情報の編集と対応ステータス管理
- 選択した購入者のステータス一括変更・一括削除
- 複数の購入者を送信対象として選択
- 件名・本文の作成とテンプレート選択
- 独自テンプレートの保存・削除
- メール下書きの自動保存
- 顧客名・注文番号の差し込みプレビュー
- 全宛先の差し込み結果を含む送信前検査
- 配信停止・バウンス・迷惑メール報告アドレスの送信除外
- 選択した宛先への個別送信シミュレーション
- 今月の送信数と配信履歴の確認
- 配信履歴のCSV出力
- 配信バッチ単位の本文・宛先別結果確認
- 復元前の自動バックアップ
- Supabase Authによるサーバー認証（設定時）
- LocalStorageからSupabaseへのプロジェクト単位移行
- Supabase移行後の自動保存・複数端末共有
- Supabase上のプロジェクト作成・切替・削除
- Resendによる宛先別実送信（設定時・テストモード解除時）
- 送信要求とResend APIの冪等性キーによる二重送信防止
- 署名検証・重複排除付きResend Webhook
- バウンス・迷惑メール報告の配信停止リスト自動反映

## 技術構成

- Next.js（App Router）
- React
- TypeScript（strict mode）
- Tailwind CSS
- ESLint
- Vitest

## アーキテクチャ

機能ごとに `domain`、`application`、`infrastructure`、`ui` を分離しています。

```text
src/features/
├── projects/
├── customers/
├── templates/
├── composer/
├── deliveries/
├── storage/
├── suppressions/
└── dashboard/
```

画面はRepositoryインターフェースを通じてデータへアクセスします。現在はLocalStorage実装を利用しており、将来はUIを変更せずSupabase実装へ差し替えられる構成です。

メール送信も `MailDeliveryService` で抽象化しています。現在はローカルシミュレーション実装を使用し、宛先別の成功・失敗と再送対象を扱える設計です。次工程のSupabaseスキーマ案は `supabase/migrations/0001_initial_schema.sql`、接続方針は `docs/next-data-layer.md` を参照してください。これらはまだ外部サービスへ適用されません。

配信履歴では失敗した宛先だけを選択し、再送シミュレーションできます。送信済みの宛先は再送対象にならないため、成功分の二重送信を防げます。

配信操作はバッチとしてプロジェクト別に保存され、件名・本文・全体ステータス・宛先別結果を保持します。再送前には対象メールアドレスと前回エラーを確認するダイアログが表示されます。

## 管理画面の設定

プロジェクトごとに以下を設定できます。

- ローカル／Resend送信プロバイダー
- Resend APIキーとWebhook署名シークレット
- 送信元名・送信元アドレス・返信先
- 件名接頭辞・署名・共通フッター
- テストモード・処理件数・送信間隔
- 配信停止案内の付与
- LocalStorage／Supabaseデータプロバイダー
- Supabase Project URL・anon key
- プロジェクト名変更・削除
- プロジェクト単位のJSONバックアップ・復元
- 復元前の確認と現データの自動退避
- 配信停止・送信除外リスト
- CSV除外エラーの一覧表示・CSV出力
- 設定変更の未保存表示・移動時確認

通常設定はLocalStorage、APIキーなどの秘密情報はSessionStorageへ分離して保存します。秘密情報はブラウザを閉じると消えます。本番では管理者専用APIとサーバー側暗号化ストレージへ置き換える前提です。Supabaseの`service_role`キーは管理画面へ入力しないでください。

ローカルで失敗・再送フローを確認する場合は、`sample+fail@example.com`のように`+fail`を含むアドレスを登録してください。初回だけ失敗として記録され、履歴から再送すると成功します。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## サーバー接続

`.env.example`を参考に、デプロイ先のサーバー環境変数へSupabaseとResendの値を設定します。`SUPABASE_SERVICE_ROLE_KEY`、`RESEND_API_KEY`、`RESEND_WEBHOOK_SECRET`を`NEXT_PUBLIC_`付き変数へ入れたり、ブラウザへ返したりしないでください。

Supabaseへ以下の順序でマイグレーションを適用します。

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_server_operations.sql
```

Resend Webhookの送信先は次のURLです。

```text
https://your-domain.example/api/webhooks/resend
```

管理画面で送信プロバイダーを`Resend`にしてテストモードを解除した場合だけ、`POST /api/deliveries`が実メールを送信します。テストモード中はローカルシミュレーションです。

サーバーAPIは次の安全策を持ちます。

- Supabase Authのログイン必須
- RLSによるプロジェクト所属確認
- 1回100宛先までの入力検証
- DBとResend双方の冪等性キー
- DB配信停止リストの再検査
- Webhook署名検証と`svix-id`重複排除
- バウンス・苦情アドレスの自動送信除外

既存データは管理画面の「設定 → データ保存・移行 → Supabaseへ移行」からプロジェクト単位で移行できます。移行前にはJSONバックアップが自動ダウンロードされ、元のLocalStorageデータも切り戻し用に残ります。移行後は変更がSupabaseへ自動保存され、同じユーザーでログインした別端末から参照できます。

## 検証

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

GitHub ActionsではPull Requestと`master`へのpush時に、依存関係のクリーンインストール、lint、型検査、テスト、本番ビルドを実行します。

## 画面

- `/`：ローカル仮ログイン
- `/dashboard`：購入者・送信・履歴管理

## 今後の接続ポイント

次の主な工程はResendの送信ドメイン・Webhook設定と非同期ジョブキューです。LeadHIVE・CRM連携、ステップメール、開封・クリック分析はMVP以降の対象です。

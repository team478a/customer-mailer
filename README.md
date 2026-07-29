# MailSend

購入者へ最大100件程度のメールを個別送信するための、シンプルな管理システムです。

現在は外部サービスへ接続しないローカルMVPです。購入者、送信内容、配信履歴はブラウザの `localStorage` に保存されます。メールの実送信は行わず、個別送信の結果をシミュレーションして記録します。

## 現在できること

- ローカルの仮ログイン
- プロジェクトの作成・切り替え
- 購入者、テンプレート、下書き、配信履歴のプロジェクト別管理
- 購入者の登録・削除（最大100件）
- CSVからの購入者取り込み
- 名前、メールアドレス、注文番号による検索
- 購入者情報の編集と対応ステータス管理
- 複数の購入者を送信対象として選択
- 件名・本文の作成とテンプレート選択
- 独自テンプレートの保存・削除
- メール下書きの自動保存
- 顧客名・注文番号の差し込みプレビュー
- 送信前の最終確認
- 選択した宛先への個別送信シミュレーション
- 今月の送信数と配信履歴の確認
- 配信履歴のCSV出力

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
└── dashboard/
```

画面はRepositoryインターフェースを通じてデータへアクセスします。現在はLocalStorage実装を利用しており、将来はUIを変更せずSupabase実装へ差し替えられる構成です。

メール送信も `MailDeliveryService` で抽象化しています。現在はローカルシミュレーション実装を使用し、宛先別の成功・失敗と再送対象を扱える設計です。次工程のSupabaseスキーマ案は `supabase/migrations/0001_initial_schema.sql`、接続方針は `docs/next-data-layer.md` を参照してください。これらはまだ外部サービスへ適用されません。

配信履歴では失敗した宛先だけを選択し、再送シミュレーションできます。送信済みの宛先は再送対象にならないため、成功分の二重送信を防げます。

ローカルで失敗・再送フローを確認する場合は、`sample+fail@example.com`のように`+fail`を含むアドレスを登録してください。初回だけ失敗として記録され、履歴から再送すると成功します。

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

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

永続化をSupabase、個別メール送信をResendなどのサーバー側サービスへ差し替えられる構成を想定しています。顧客管理、CSV取込、テンプレート、LeadHIVE・CRM連携、ステップメール、開封・クリック計測はMVP以降の対象です。

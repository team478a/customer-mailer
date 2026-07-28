# MailFlow

メール配信システムのフロントエンド基盤です。Phase 0では、Next.jsの初期構築と仮画面のみを実装しています。

## 技術構成

- Next.js（App Router）
- React
- TypeScript（strict mode）
- Tailwind CSS
- ESLint

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## コマンド

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## 画面

- `/`：仮ログイン画面
- `/dashboard`：仮ダッシュボード

## Phase 0の制約

ログインは画面遷移のみです。認証、データ保存、メール送信は実装しておらず、SupabaseおよびResendにも接続していません。

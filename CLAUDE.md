# CLAUDE.md - Rooms プロジェクト

## プロジェクト概要

LINE ミニアプリによるイベント管理・チケット販売アプリ。
LINE ミニアプリチャネル（未認証ミニアプリ、審査不要）を使用。

## 技術スタック

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Prisma 7** + PostgreSQL (ドライバーアダプター `@prisma/adapter-pg` 必須)
- **Stripe** (決済) + **LINE ミニアプリチャネル** + **@line/liff** + **@line/bot-sdk**
- **Docker Compose** で開発環境を構築 (app + db)
- `"type": "module"` (ESM)

## 開発コマンド

```bash
# Docker で起動
docker compose up --build

# マイグレーション (Docker 内)
docker compose exec app npx prisma migrate dev --name <name>

# Prisma クライアント生成 (migrate dev では自動実行されない)
docker compose exec app npx prisma generate

# シードデータ投入
docker compose exec app npx prisma db seed

# ビルド確認 (ローカル)
node node_modules/next/dist/bin/next build
```

## Prisma 7 の注意点

- `prisma/schema.prisma`: `provider = "prisma-client"`, `output = "../src/generated/prisma"`
- datasource の `url` は `prisma.config.ts` で設定 (schema.prisma には書かない)
- クライアントの import: `import { PrismaClient } from "@/generated/prisma/client"`
- `PrismaPg` ドライバーアダプターが必須: `new PrismaClient({ adapter })`
- `prisma migrate dev` 後に `prisma generate` を手動実行する必要がある
- `.env` ファイルは自動読み込みされない (`prisma.config.ts` で `import "dotenv/config"` が必要)
- シード設定は `prisma.config.ts` の `migrations.seed` に記載 (`tsx prisma/seed.ts`)

## ディレクトリ構成

- `src/app/` - ページ & API Routes (App Router)
- `src/components/` - React コンポーネント
- `src/lib/` - ユーティリティ (prisma, auth, stripe, line-messaging)
- `src/generated/prisma/` - Prisma 生成ファイル (gitignore 対象)
- `prisma/` - スキーマ, シード, マイグレーション

## API 認証方式

- LIFF アクセストークンを `Authorization: Bearer <token>` で送信
- サーバー側で LINE API (`https://api.line.me/oauth2/v2.1/verify`) を呼んで検証
- `src/lib/auth.ts` の `getAuthUser()` で認証ユーザーを取得

## DB モデル

- **User** - LINE ユーザー (line_user_id がユニークキー)
- **Event** - イベント (price は JPY 整数)
- **Ticket** - チケット (qr_code に UUID、status: ACTIVE/CANCELLED/USED/EXPIRED)
- **Payment** - 決済 (Ticket と 1:1、stripe_payment_intent_id がユニーク)

## LINE ミニアプリチャネル

- 従来の「LINE Login チャネル + LIFF」ではなく **LINE ミニアプリチャネル** を使用
- チャネル作成時に LIFF アプリが自動で1つ作成される
- 未認証ミニアプリとして審査不要で公開可能
- LIFF SDK (`@line/liff`) はそのまま使用可能（内部的に LIFF で動作）
- 権限許可フローは段階的に自動表示される（コードでの明示的な権限要求は不要）
- **長期チャネルアクセストークンは使用不可** → ステートレスチャネルアクセストークンを API で都度発行（15分有効、発行数制限なし）
- トークン発行: `POST https://api.line.me/oauth2/v3/token` に `client_id` + `client_secret` を送信
- `src/lib/line-messaging.ts` で自動的にトークンを発行してメッセージ送信

## 環境変数

`.env.local` に設定。`.env` は Prisma CLI 用 (ローカルから `prisma migrate` する場合)。
Docker 内では `docker-compose.yml` の `DATABASE_URL` 環境変数が優先される。
全ての LINE 関連変数は LINE ミニアプリチャネルの「チャネル基本設定」タブから取得する。

必要な変数: `DATABASE_URL`, `NEXT_PUBLIC_LIFF_ID`, `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
